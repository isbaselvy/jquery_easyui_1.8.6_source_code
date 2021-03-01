/**
 * EasyUI for jQuery 1.5.3
 * 
 * Copyright (c) 2009-2017 www.jeasyui.com. All rights reserved.
 *
 * Licensed under the commercial license: http://www.jeasyui.com/license_commercial.php
 * To use it on other terms please contact us: info@jeasyui.com
 *
 */
/**
 * calendar - EasyUI for jQuery
 * 
 */
(function ($) {

	/**
	 * 设置大小
	 * @param {*} target 
	 * @param {*} param 
	 */
	function setSize(target, param) {
		var opts = $.data(target, 'calendar').options;
		var t = $(target);
		if (param) {
			$.extend(opts, {
				width: param.width,
				height: param.height
			});
		}
		t._size(opts, t.parent());
		t.find('.calendar-body')._outerHeight(t.height() - t.find('.calendar-header')._outerHeight());
		if (t.find('.calendar-menu').is(':visible')) {
			showSelectMenus(target);
		}
	}

	function init(target) {
		$(target).addClass('calendar').html(
			'<div class="calendar-header">' +
			'<div class="calendar-nav calendar-prevmonth"></div>' +
			'<div class="calendar-nav calendar-nextmonth"></div>' +
			'<div class="calendar-nav calendar-prevyear"></div>' +
			'<div class="calendar-nav calendar-nextyear"></div>' +
			'<div class="calendar-title">' +
			'<span class="calendar-text"></span>' +
			'</div>' +
			'</div>' +
			'<div class="calendar-body">' +
			'<div class="calendar-menu">' + // 月 年
			'<div class="calendar-menu-year-inner">' +
			'<span class="calendar-nav calendar-menu-prev"></span>' +
			'<span><input class="calendar-menu-year" type="text"></input></span>' +
			'<span class="calendar-nav calendar-menu-next"></span>' +
			'</div>' +
			'<div class="calendar-menu-month-inner">' +
			'</div>' +
			'<div class="calendar-menu-year-container">' +
			'</div>' +
			'</div>' +
			'</div>'
		);


		$(target).bind('_resize', function (e, force) {
			if ($(this).hasClass('easyui-fluid') || force) {
				setSize(target);
			}
			return false;
		});
	}

	function bindEvents(target) {
		/**
		 * year month改变都会改对应的日期
		 */
		var opts = $.data(target, 'calendar').options;
		var menu = $(target).find('.calendar-menu');
		var mode = opts.mode.toUpperCase()
		var modeEvent = {
			'Y': {
				click: function (e) {
					var menu = $(target).find('.calendar-menu');
					var t = toTarget(e.target);
					if (t.hasClass('calendar-nextyear')) {
						// 下一年
						opts.yearRange[0] += 10;
						opts.yearRange[1] += 10;
						showYearPanel(target);
					} else if (t.hasClass('calendar-prevyear')) {
						// 上一年
						opts.yearRange[0] -= 10;
						opts.yearRange[1] -= 10;
						showYearPanel(target);
					} else if (t.hasClass('calendar-menu-year-item')) {
						// 选中年
						if (t.hasClass('calendar-disabled')) {
							return
						}
						
						menu.find('.calendar-selected').removeClass('calendar-selected');
						t.addClass('calendar-selected');
						var oldValue = opts.current;
						var year = t.attr('abbr'); // 选中的月份
						var month = 0;
						var day = 1;
						// current只能是一个date对象，select，change会用到，datebox，detatimebox才能设值
						opts.current = new Date(year, month, day);
						opts.onSelect.call(target, opts.current);
						if (!oldValue || oldValue.getTime() != opts.current.getTime()) {
							opts.onChange.call(target, opts.current, oldValue);
						}
						if (opts.year != year) {
							opts.year = parseInt(year);
							opts.yearRange = getYearRange(year)
							showYearPanel(target)
						}
					}
				}
			},
			'D': {
				yearKeypress: function (hideMenu) {
					setDate(true);
				},
				click: function (e) {
					var t = toTarget(e.target);
					if (t.hasClass('calendar-menu-next') || t.hasClass('calendar-nextyear')) {
						// 下一年
						showYear(1);
					} else if (t.hasClass('calendar-menu-prev') || t.hasClass('calendar-prevyear')) {
						// 上一年
						showYear(-1);
					} else if (t.hasClass('calendar-menu-month')) {
						// 选中月份
						menu.find('.calendar-selected').removeClass('calendar-selected');
						t.addClass('calendar-selected');
						setDate(true);
					} else if (t.hasClass('calendar-prevmonth')) {
						showMonth(-1); // 上一个月
					} else if (t.hasClass('calendar-nextmonth')) {
						showMonth(1); // 下一个月
					} else if (t.hasClass('calendar-text')) {
						// 点击title时隐藏日显示月
						if (menu.is(':visible')) {
							menu.hide();
						} else {
							showSelectMenus(target);
						}
					} else if (t.hasClass('calendar-day')) {
						// 选中日
						if (t.hasClass('calendar-disabled')) {
							return
						}
						var oldValue = opts.current;
						t.closest('div.calendar-body').find('.calendar-selected').removeClass('calendar-selected');
						t.addClass('calendar-selected');
						var parts = t.attr('abbr').split(',');
						var y = parseInt(parts[0]);
						var m = parseInt(parts[1]);
						var d = parseInt(parts[2]);
						opts.current = new Date(y, m - 1, d);
						opts.onSelect.call(target, opts.current);
						if (!oldValue || oldValue.getTime() != opts.current.getTime()) {
							opts.onChange.call(target, opts.current, oldValue);
						}
						if (opts.year != y || opts.month != m) {
							opts.year = y;
							opts.month = m;
							show(target);
						}
					}
				}
			},
			'M': {
				yearKeypress: function (hideMenu) {
					var menu = $(target).find('.calendar-menu');
					var year = menu.find('.calendar-menu-year').val(); // 取值年份输入框值
					if (!isNaN(year)) {
						opts.year = parseInt(year);
						showMonthPanel(target)
					}
				},
				click: function (e) {
					var menu = $(target).find('.calendar-menu');
					var t = toTarget(e.target);
					if (t.hasClass('calendar-menu-next') || t.hasClass('calendar-nextyear')) {
						// 下一年
						opts.year += 1;
						showMonthPanel(target);
						menu.find('.calendar-menu-year').val(opts.year);
					} else if (t.hasClass('calendar-menu-prev') || t.hasClass('calendar-prevyear')) {
						// 上一年
						opts.year += -1;
						showMonthPanel(target);
						menu.find('.calendar-menu-year').val(opts.year);
					} else if (t.hasClass('calendar-menu-month')) {
						// 选中月份
						var menu = $(target).find('.calendar-menu');
						if (t.hasClass('calendar-disabled')) {
							return
						}
						menu.find('.calendar-selected').removeClass('calendar-selected');
						t.addClass('calendar-selected');
						var oldValue = opts.current;
						opts.current = new Date(y, m - 1, d);
						var y = menu.find('.calendar-menu-year').val(); // 取值年份输入框值
						var m = t.attr('abbr'); // 选中的月份
						var d = 1
						opts.current = new Date(y, m - 1, d);
						opts.onSelect.call(target, opts.current);
						if (!oldValue || oldValue.getTime() != opts.current.getTime()) {
							opts.onChange.call(target, opts.current, oldValue);
						}
						
						if (opts.year != y || opts.month != m) {
							opts.year = parseInt(y);
							opts.month = parseInt(m);
							showMonthPanel(target)
						}
					}
				}
			}
		}
		// title 输入年份回车
		menu.find('.calendar-menu-year').unbind('.calendar').bind('keypress.calendar', function (e) {
			if (e.keyCode == 13) {
				// setDate(true);
				modeEvent[mode].yearKeypress(true)
			}
		});
		// 鼠标移入移出样式
		$(target).unbind('.calendar').bind('mouseover.calendar', function (e) {
			var t = toTarget(e.target);
			if (t.hasClass('calendar-nav') || t.hasClass('calendar-text') || (t.hasClass('calendar-day') && !t.hasClass('calendar-disabled'))) {
				t.addClass('calendar-nav-hover');
			}
		}).bind('mouseout.calendar', function (e) {
			var t = toTarget(e.target);
			if (t.hasClass('calendar-nav') || t.hasClass('calendar-text') || (t.hasClass('calendar-day') && !t.hasClass('calendar-disabled'))) {
				t.removeClass('calendar-nav-hover');
			}
		}).bind('click.calendar', function (e) {
			// 点击事件
			modeEvent[mode].click(e)
		});
		/**
		 * 点击往上找,是日期day则返回day,否则返回点击的元素本身
		 * @param {*} t 
		 */
		function toTarget(t) {
			var day = $(t).closest('.calendar-day');
			if (day.length) {
				return day;
			} else {
				return $(t);
			}
		}

		function setDate(hideMenu) {
			var menu = $(target).find('.calendar-menu');
			var year = menu.find('.calendar-menu-year').val(); // 取值年份输入框值
			var month = menu.find('.calendar-selected').attr('abbr'); // 选中的月份
			if (!isNaN(year)) {
				opts.year = parseInt(year);
				opts.month = parseInt(month);
				show(target); // 显示日
			}
			if (hideMenu) {
				menu.hide()
			}
		}

		function showYear(delta) {
			opts.year += delta;
			show(target);
			menu.find('.calendar-menu-year').val(opts.year);
		}

		function showMonth(delta) {
			opts.month += delta;
			if (opts.month > 12) {
				opts.year++;
				opts.month = 1;
			} else if (opts.month < 1) {
				opts.year--;
				opts.month = 12;
			}
			show(target);

			menu.find('td.calendar-selected').removeClass('calendar-selected');
			menu.find('td:eq(' + (opts.month - 1) + ')').addClass('calendar-selected');
		}
	}

	function showMonthPanel(target) {
		var opts = $.data(target, 'calendar').options;
		$(target).find('.calendar-menu').show();
		$(target).find('.calendar-prevmonth').hide();
		$(target).find('.calendar-nextmonth').hide();
		// 校验current
		if (opts.current && !opts.validator.call(target, opts.current)) {
			opts.current = null;
		}
		// 计算今天和设置的当前日期
		var now = new Date();
		if(opts.current && opts.current.getMonth() != opts.month) {
			opts.month = opts.current.getMonth() + 1;
		}

		// 设置年月
		$(target).find('.calendar-title span').html(opts.year);
		// 设置月份面板table
		$(target).find('.calendar-menu-month-inner').empty();
		var t = $('<table class="calendar-mtable"></table>').appendTo($(target).find('.calendar-menu-month-inner'));
		var idx = 0;
		for (var i = 0; i < 3; i++) {
			var tr = $('<tr></tr>').appendTo(t);
			for (var j = 0; j < 4; j++) {
				var dvalue = new Date(opts.year, idx, 1);
				var cls = 'calendar-nav calendar-menu-month';
				if (opts.year == now.getFullYear() && idx == now.getMonth()) {
					cls += ' calendar-today'
				}
				if (opts.year == (opts.current && opts.current.getFullYear()) && idx == (opts.current && opts.current.getMonth())) {
					cls += ' calendar-selected'
				}
				if (!opts.validator.call(target, dvalue)) {
					cls += ' calendar-disabled';
				}
				var td = '<td class="' + cls + '"></td>'
				$(td).html(opts.months[idx++]).attr('abbr', idx).appendTo(tr);
			}
		}

		var body = $(target).find('.calendar-body');
		var sele = $(target).find('.calendar-menu');
		var seleYear = sele.find('.calendar-menu-year-inner');
		var seleMonth = sele.find('.calendar-menu-month-inner');

		seleYear.find('input').val(opts.year).focus();

		sele._outerWidth(body._outerWidth());
		sele._outerHeight(body._outerHeight());
		seleMonth._outerHeight(sele.height() - seleYear._outerHeight());
	}

	/**
	 * 一次显示10年，4*4=16，不在10年之内的灰色，获取year的二维数组
	 * @param {*} target 
	 * 倒数第二位是偶数 
	 * 7 8 9 0，1 2 3 4，5 6 7 8， 9 0 1 2
	 * 倒数第二数是奇数 9 0 1 2，3 4 5 6，7 8 9 0， 1 2 3 4
	 */
	function getYears(yearRange) {
		var years = [];
		// 获取倒数第二位
		var startYear = yearRange[0]
		var tensNum = getTensNum(startYear);

		if (tensNum % 2 == 0) {
			years.push([startYear - 3, startYear - 2, startYear - 1, startYear]);
			years.push([startYear + 1, startYear + 2, startYear + 3, startYear + 4]);
			years.push([startYear + 5, startYear + 6, startYear + 7, startYear + 8]);
			years.push([startYear + 9, startYear + 10, startYear + 11, startYear + 12]);
		} else {
			years.push([startYear - 1, startYear, startYear + 1, startYear + 2]);
			years.push([startYear + 3, startYear + 4, startYear + 5, startYear + 6]);
			years.push([startYear + 7, startYear + 8, startYear + 9, startYear + 10]);
			years.push([startYear + 11, startYear + 12, startYear + 13, startYear + 14]);
		}

		return years
	}

	function getYearRange(year) {
		var yearArr = String(year).split('');
		var tensNum = yearArr[yearArr.length - 2];
		var yearStart = parseInt(yearArr[0] + yearArr[1] + tensNum + '0');
		var yearEnd = parseInt(yearArr[0] + yearArr[1] + tensNum + '9');
		return [yearStart, yearEnd]
	}

	function getTensNum(year) {
		var yearArr = String(year).split('');
		var tensNum = yearArr[yearArr.length - 2];
		return tensNum;
	}

	function showYearPanel(target) {
		var opts = $.data(target, 'calendar').options;
		$(target).find('.calendar-menu').show();
		$(target).find('.calendar-menu .calendar-menu-year-inner').hide();
		$(target).find('.calendar-menu .calendar-menu-month-inner').hide();
		$(target).find('.calendar-prevmonth').hide();
		$(target).find('.calendar-nextmonth').hide();
		// 校验current
		if (opts.current && !opts.validator.call(target, opts.current)) {
			opts.current = null;
		}
		// 计算今天和设置的当前日期
		var now = new Date();
		var nowYear = now.getFullYear();
		var currentYear = opts.current ? (opts.current.getFullYear()) : '';

		// 获取年份范围
		var yearRange = opts.yearRange;
		// 设置年月
		$(target).find('.calendar-title span').html(yearRange.join(' - '));
		// 设置年面板table
		var years = getYears(yearRange)
		$(target).find('.calendar-menu-year-container').empty();

		var t = $('<table class="calendar-ytable"></table>').appendTo($(target).find('.calendar-menu-year-container'));
		for (var i = 0; i < years.length; i++) {
			var tr = $('<tr></tr>').appendTo(t);
			var yearArr = years[i];
			for (var j = 0; j < yearArr.length; j++) {
				var yearTxt = yearArr[j];
				var cls = "calendar-nav calendar-menu-year-item";
				var dvalue = new Date(yearTxt, 0, 1);
				if (yearTxt < yearRange[0] || yearTxt > yearRange[1]) {
					cls += ' calendar-other-year'
				}
				// 今天的样式
				if (yearTxt == nowYear) {
					cls += ' calendar-today';
				}
				// disable
				if (!opts.validator.call(target, dvalue)) {
					cls += ' calendar-disabled';
				}

				var tds = '<td class="' + cls + '"></td>'
				$(tds).html(yearTxt).attr('abbr', yearTxt).appendTo(tr);
			}
		}

		var body = $(target).find('.calendar-body');
		var sele = $(target).find('.calendar-menu');
		var seleYear = sele.find('.calendar-menu-year-container');
		// var seleMonth = sele.find('.calendar-menu-month-inner');

		// seleYear.find('input').val(opts.year).focus();
		seleYear.find('td.calendar-selected').removeClass('calendar-selected');
		seleYear.find('td[abbr="' + currentYear + '"]').addClass('calendar-selected');

		sele._outerWidth(body._outerWidth());
		sele._outerHeight(body._outerHeight());
		seleYear._outerHeight(sele.height());
	}
	/**
	 * show the select menu that can change year or month, if the menu is not be created then create it.
	 */
	function showSelectMenus(target) {
		var opts = $.data(target, 'calendar').options;
		$(target).find('.calendar-menu').show();

		// 设置月份面板table
		if ($(target).find('.calendar-menu-month-inner').is(':empty')) {
			$(target).find('.calendar-menu-month-inner').empty();
			var t = $('<table class="calendar-mtable"></table>').appendTo($(target).find('.calendar-menu-month-inner'));
			var idx = 0;
			for (var i = 0; i < 3; i++) {
				var tr = $('<tr></tr>').appendTo(t);
				for (var j = 0; j < 4; j++) {
					$('<td class="calendar-nav calendar-menu-month"></td>').html(opts.months[idx++]).attr('abbr', idx).appendTo(tr);
				}
			}
		}

		var body = $(target).find('.calendar-body');
		var sele = $(target).find('.calendar-menu');
		var seleYear = sele.find('.calendar-menu-year-inner');
		var seleMonth = sele.find('.calendar-menu-month-inner');

		seleYear.find('input').val(opts.year).focus();
		seleMonth.find('td.calendar-selected').removeClass('calendar-selected');
		seleMonth.find('td:eq(' + (opts.month - 1) + ')').addClass('calendar-selected');

		sele._outerWidth(body._outerWidth());
		sele._outerHeight(body._outerHeight());
		seleMonth._outerHeight(sele.height() - seleYear._outerHeight());
	}

	/**
	 * get weeks data. 获取本月的每周对应的日期二维数组，一共6周
	 */
	function getWeeks(target, year, month) {
		var opts = $.data(target, 'calendar').options;
		var dates = [];
		var lastDay = new Date(year, month, 0).getDate();
		for (var i = 1; i <= lastDay; i++) dates.push([year, month, i]);

		// group date by week
		var weeks = [],
			week = [];
		var memoDay = -1;
		while (dates.length > 0) {
			var date = dates.shift();
			week.push(date);
			var day = new Date(date[0], date[1] - 1, date[2]).getDay();
			if (memoDay == day) {
				day = 0;
			} else if (day == (opts.firstDay == 0 ? 7 : opts.firstDay) - 1) {
				weeks.push(week);
				week = [];
			}
			memoDay = day;
		}
		if (week.length) {
			weeks.push(week);
		}

		var firstWeek = weeks[0];
		if (firstWeek.length < 7) {
			while (firstWeek.length < 7) {
				var firstDate = firstWeek[0];
				var date = new Date(firstDate[0], firstDate[1] - 1, firstDate[2] - 1)
				firstWeek.unshift([date.getFullYear(), date.getMonth() + 1, date.getDate()]);
			}
		} else {
			var firstDate = firstWeek[0];
			var week = [];
			for (var i = 1; i <= 7; i++) {
				var date = new Date(firstDate[0], firstDate[1] - 1, firstDate[2] - i);
				week.unshift([date.getFullYear(), date.getMonth() + 1, date.getDate()]);
			}
			weeks.unshift(week);
		}

		var lastWeek = weeks[weeks.length - 1];
		while (lastWeek.length < 7) {
			var lastDate = lastWeek[lastWeek.length - 1];
			var date = new Date(lastDate[0], lastDate[1] - 1, lastDate[2] + 1);
			lastWeek.push([date.getFullYear(), date.getMonth() + 1, date.getDate()]);
		}
		if (weeks.length < 6) {
			var lastDate = lastWeek[lastWeek.length - 1];
			var week = [];
			for (var i = 1; i <= 7; i++) {
				var date = new Date(lastDate[0], lastDate[1] - 1, lastDate[2] + i);
				week.push([date.getFullYear(), date.getMonth() + 1, date.getDate()]);
			}
			weeks.push(week);
		}

		return weeks;
	}

	/**
	 * show the calendar day.
	 */
	function show(target) {
		var opts = $.data(target, 'calendar').options;
		// 校验current
		if (opts.current && !opts.validator.call(target, opts.current)) {
			opts.current = null;
		}
		// 计算今天和设置的当前日期
		var now = new Date();
		var todayInfo = now.getFullYear() + ',' + (now.getMonth() + 1) + ',' + now.getDate();
		var currentInfo = opts.current ? (opts.current.getFullYear() + ',' + (opts.current.getMonth() + 1) + ',' + opts.current.getDate()) : '';
		// 计算周六，周末的index calulate the saturday and sunday index
		var saIndex = 6 - opts.firstDay;
		var suIndex = saIndex + 1;
		if (saIndex >= 7) saIndex -= 7;
		if (suIndex >= 7) suIndex -= 7;
		// 设置年月
		$(target).find('.calendar-title span').html(opts.months[opts.month - 1] + ' ' + opts.year);
		// 移除日期table
		var body = $(target).find('div.calendar-body');
		body.children('table').remove();

		var data = ['<table class="calendar-dtable" cellspacing="0" cellpadding="0" border="0">'];
		data.push('<thead><tr>');
		// 竖着显示是一年的第几周
		if (opts.showWeek) {
			data.push('<th class="calendar-week">' + opts.weekNumberHeader + '</th>');
		}
		// 周一~周天
		for (var i = opts.firstDay; i < opts.weeks.length; i++) {
			data.push('<th>' + opts.weeks[i] + '</th>');
		}
		for (var i = 0; i < opts.firstDay; i++) {
			data.push('<th>' + opts.weeks[i] + '</th>');
		}
		data.push('</tr></thead>');
		// 表体
		data.push('<tbody>');
		// 计算当前月的6个周的每周该显示的日期 二维数组
		var weeks = getWeeks(target, opts.year, opts.month);
		for (var i = 0; i < weeks.length; i++) {
			var week = weeks[i];
			var cls = '';
			if (i == 0) {
				cls = 'calendar-first';
			} else if (i == weeks.length - 1) {
				cls = 'calendar-last';
			}
			data.push('<tr class="' + cls + '">');
			// 显示周数
			if (opts.showWeek) {
				var weekNumber = opts.getWeekNumber(new Date(week[0][0], parseInt(week[0][1]) - 1, week[0][2]));
				data.push('<td class="calendar-week">' + weekNumber + '</td>');
			}
			// 显示日期
			for (var j = 0; j < week.length; j++) {
				var day = week[j]; // [nian, yue, ri]
				var s = day[0] + ',' + day[1] + ',' + day[2];
				var dvalue = new Date(day[0], parseInt(day[1]) - 1, day[2]);
				var d = opts.formatter.call(target, dvalue);
				// 自定义css
				var css = opts.styler.call(target, dvalue);
				var classValue = '';
				var styleValue = '';
				if (typeof css == 'string') {
					styleValue = css;
				} else if (css) {
					classValue = css['class'] || '';
					styleValue = css['style'] || '';
				}
				// 非本月的显示其他样式
				var cls = 'calendar-day';
				if (!(opts.year == day[0] && opts.month == day[1])) {
					cls += ' calendar-other-month';
				}
				// 今天的样式
				if (s == todayInfo) {
					cls += ' calendar-today';
				}
				// 当前的选中样式
				if (s == currentInfo) {
					cls += ' calendar-selected';
				}
				// 周六周末样式
				if (j == saIndex) {
					cls += ' calendar-saturday';
				} else if (j == suIndex) {
					cls += ' calendar-sunday';
				}
				if (j == 0) {
					cls += ' calendar-first';
				} else if (j == week.length - 1) {
					cls += ' calendar-last';
				}

				cls += ' ' + classValue;
				// 可选
				if (!opts.validator.call(target, dvalue)) {
					cls += ' calendar-disabled';
				}

				data.push('<td class="' + cls + '" abbr="' + s + '" style="' + styleValue + '">' + d + '</td>');
			}
			data.push('</tr>');
		}
		data.push('</tbody>');
		data.push('</table>');

		body.append(data.join(''));
		body.children('table.calendar-dtable').prependTo(body);

		opts.onNavigate.call(target, opts.year, opts.month);
	}

	/**
	 * 根据模式选择显示年，月，日
	 */
	function showByModel(target) {
		var opts = $.data(target, 'calendar').options;
		var mode = opts.mode.toUpperCase()
		if (mode === 'D') {
			show(target);
			$(this).find('div.calendar-menu').hide();
		} else if (mode === 'M') {
			showMonthPanel(target)
		} else if (mode === 'Y') {
			showYearPanel(target)
		}
	}

	$.fn.calendar = function (options, param) {
		if (typeof options == 'string') {
			return $.fn.calendar.methods[options](this, param);
		}

		options = options || {};

		return this.each(function () {
			var state = $.data(this, 'calendar');
			if (state) {
				$.extend(state.options, options);
			} else {
				state = $.data(this, 'calendar', {
					options: $.extend({}, $.fn.calendar.defaults, $.fn.calendar.parseOptions(this), options)
				});
				init(this);
			}
			if (state.options.border == false) {
				$(this).addClass('calendar-noborder');
			}
			// 如果有年并且是年模式，根据自定义的年计算年面板范围
			if (state.options.year && state.options.mode.toUpperCase() == 'Y') {
				state.options.yearRange = getYearRange(state.options.year)
			}
			setSize(this);
			bindEvents(this);
			// todo 根据设置的模式选择显示年，月，日 年的时候面板  title月份
			showByModel(this)
			// show(this);
			// $(this).find('div.calendar-menu').hide();	// hide the calendar menu
		});
	};

	$.fn.calendar.methods = {
		options: function (jq) {
			return $.data(jq[0], 'calendar').options;
		},
		resize: function (jq, param) {
			return jq.each(function () {
				setSize(this, param);
			});
		},
		moveTo: function (jq, date) {
			return jq.each(function () {
				if (!date) {
					var now = new Date();
					$(this).calendar({
						year: now.getFullYear(),
						month: now.getMonth() + 1,
						current: date
					});
					return;
				}
				var opts = $(this).calendar('options');
				if (opts.validator.call(this, date)) {
					var oldValue = opts.current;
					$(this).calendar({
						year: date.getFullYear(),
						month: date.getMonth() + 1,
						current: date
					});
					if (!oldValue || oldValue.getTime() != date.getTime()) {
						opts.onChange.call(this, opts.current, oldValue);
					}
				}
			});
		}
	};

	$.fn.calendar.parseOptions = function (target) {
		var t = $(target);
		return $.extend({}, $.parser.parseOptions(target, [
			'weekNumberHeader', {
				firstDay: 'number',
				fit: 'boolean',
				border: 'boolean',
				showWeek: 'boolean'
			}
		]));
	};

	$.fn.calendar.defaults = {
		mode: 'D',
		width: 180,
		height: 180,
		fit: false,
		border: true,
		showWeek: false,
		firstDay: 0,
		weeks: ['S', 'M', 'T', 'W', 'T', 'F', 'S'],
		months: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
		year: new Date().getFullYear(),
		month: new Date().getMonth() + 1,
		// yearRange: getYearRange(new Date().getFullYear()), // 0~9的十年为一个范围
		current: (function () {
			var d = new Date();
			return new Date(d.getFullYear(), d.getMonth(), d.getDate());
		})(),
		weekNumberHeader: '',
		getWeekNumber: function (date) {
			var checkDate = new Date(date.getTime());
			checkDate.setDate(checkDate.getDate() + 4 - (checkDate.getDay() || 7));
			var time = checkDate.getTime();
			checkDate.setMonth(0);
			checkDate.setDate(1);
			return Math.floor(Math.round((time - checkDate) / 86400000) / 7) + 1;
		},

		formatter: function (date) {
			return date.getDate()
		},
		styler: function (date) {
			return ''
		},
		validator: function (date) {
			return true
		},

		onSelect: function (date) {},
		onChange: function (newDate, oldDate) {},
		onNavigate: function (year, month) {}
	};
})(jQuery);