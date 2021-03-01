(function ($) {
    /**
     * TODO 给元素加类目前无法生成插件，待解决
     */
    $.parser.plugins.push('daterangebox')
    // console.log($.parser.plugins)

    /**
     * 绑定的输入框上创建panel和日历
     */
    function createRoot(target) {
        // 获取dom元素上存储的option
        var state = $.data(target, 'daterangebox');
        var opts = state.options;
        //Add:
        var leftRoot, rightRoot;
        // 创建input和按钮
        if (!state.topbar) {
            var panel = $(target).combo('panel').css('overflow', 'hidden');
            state.topbar = $('<table cellspacing="0" cellpadding="0" style="width:100%;"><tr></tr></table>').appendTo(panel);
            var tr = state.topbar.find('tr');
            var td1 = $('<td></td>').appendTo(tr).css('width', '60%');
            var td2 = $('<td></td>').appendTo(tr).css('width', '40%');

            //td1 ->
            state.leftInput = $('<input>'), state.rightInput = $('<input>');
            $.each([state.leftInput, state.rightInput], function (i, n) {
                if (i == 1) {
                    $('<span>-</span>').css({
                        'margin': '0 5px'
                    }).appendTo(td1);
                }
                n.css('width', 80).appendTo(td1);
                n.textbox();
                n.textbox('readonly', true);
            });

            //td2 ->
            state.zConfirmBtn = $('<a href="javascript:void(0);">确定</a>'),
                state.zCancelBtn = $('<a href="javascript:void(0);">取消</a>');
            $.each([state.zConfirmBtn, state.zCancelBtn], function (i, n) {
                n.css({
                    'float': 'right',
                    'width': '60px'
                }).appendTo(td2);
                n.linkbutton();
            });

            state.zConfirmBtn.on('click', function () {
                var lv = state.leftInput.textbox('getValue');
                var rv = state.rightInput.textbox('getValue');
                if (lv != '' && rv != '') {
                    var lt = opts.parser.call(target, lv).getTime(),
                        rt = opts.parser.call(target, lv).getTime();
                    if (rt >= lt) {
                        $(target).combo('setValue', lv + opts.rangeSeparator + rv).combo('setText', lv + opts.rangeSeparator + rv);
                        //
                        $(target).combo('hidePanel');
                    } else {
                        state.rightInput.textbox('textbox').parent('span').addClass('daterangebox-alert-border');
                    }
                }
            });
            state.zCancelBtn.on('click', function () {
                $(target).combo('hidePanel');
            });
        }


        /**
         * if the calendar isn't created, create it.
         * 创建日历
         */
        if (!state.calendar) {
            var panel = $(target).combo('panel').css('overflow', 'hidden');
            //Add:
            leftRoot = $('<div class="daterangebox-calendar-left"></div>').css('float', 'left').appendTo(panel);
            //Update:
            var cc = $('<div class="daterangebox-calendar-inner"></div>').prependTo(leftRoot);

            state.calendar = $('<div></div>').appendTo(cc).calendar({
                mode: opts.mode
            });
            // TODO 限制左侧时间范围
            validateLeftCalendar(target)
            $.extend(state.calendar.calendar('options'), {
                fit: true,
                border: false,
                onSelect: function (date) {
                    var target = this.target;
                    var opts = $(target).daterangebox('options');
                    setValueLeft(target, opts.formatter.call(target, date));
                    opts.onSelect.call(target, date); // 初始options报错没有onselect
                }
            });
        }

        // state.calendar
        if (!state.calendarRight) {
            var panel = $(target).combo('panel').css('overflow', 'hidden');
            //Add:
            rightRoot = $('<div class="daterangebox-calendar-right"></div>').css('float', 'left').appendTo(panel);
            //Update:
            var cc = $('<div class="daterangebox-calendar-inner"></div>').prependTo(rightRoot);
            state.calendarRight = $('<div></div>').appendTo(cc).calendar({
                mode: opts.mode
            });

            $.extend(state.calendarRight.calendar('options'), {
                fit: true,
                border: false,
                onSelect: function (date) {
                    var target = this.target;
                    var opts = $(target).daterangebox('options');
                    setValueRight(target, opts.formatter.call(target, date));
                    opts.onSelect.call(target, date);
                }
            });
        }
    }

    /**
     * 给输入框绑定下拉样式，调用createRoot创建datebox，并给输入框绑定onShowPanel事件
     */
    function createBox(target) {
        var state = $.data(target, 'daterangebox');
        var opts = state.options;
        //在'onShowPanel'触发时会执行一系列的函数.
        $(target).addClass('daterangebox-f').combo($.extend({}, opts, {
            onShowPanel: function () {
                //bindEvents(this);
                //setButtons(this);
                setCalendar(this);
                setValue(this, $(this).daterangebox('getText'), true);
                opts.onShowPanel.call(this);
            },
            required: opts.required
        }));

        $(target).combo('textbox').attr('readonly', true);
        createRoot(target);
        $(target).combo('textbox').parent().addClass('daterangebox');

        var flag = validateTime(target);
        if (!flag) {
            return
        }
        initInputValue(target)
        /**
         * 设置日历值
         * @param {*} target 输入框元素
         */
        function setCalendar(target) {
            var panel = $(target).combo('panel');
            var leftDiv = panel.children('div.daterangebox-calendar-left');
            var rightDiv = panel.children('div.daterangebox-calendar-right');

            var cc = $(leftDiv).children('div.daterangebox-calendar-inner');
            var ccRight = $(rightDiv).children('div.daterangebox-calendar-inner');

            // _outerWidth 在jquery.parser.js中有定义.
            // panel.children()._outerWidth(panel.width());
            panel.children().not('table')._outerWidth(panel.width() / 2);

            state.calendar.appendTo(cc);
            state.calendarRight.appendTo(ccRight);

            // 将日历的target指向输入框
            state.calendar[0].target = target;
            state.calendarRight[0].target = target;

            if (opts.panelHeight != 'auto') {
                var height = panel.height();
                $(leftDiv).children().not(cc).each(function () {
                    height -= $(this).outerHeight();
                });

                cc._outerHeight(height);
                ccRight._outerHeight(height);
            }

            state.calendar.calendar('resize');
            state.calendarRight.calendar('resize');
        }
    }

    /**
     * 校验开始结束时间
     */
    function validateTime(target) {
        var state = $.data(target, 'daterangebox');
        var opts = state.options;
        // startDate和endDate必须成对出现
        if ((opts.startDate && !opts.endDate) || (!opts.startDate && opts.endDate)) {
            console.error('startDate和endDate必须同时配置');
            return false;
        }
        // startDateKey和endDateKey必须成对出现
        if ((opts.startDateKey && !opts.endDateKey) || (!opts.startDateKey && opts.endDateKey)) {
            console.error('startDateKey和endDateKey必须同时配置');
            return false;
        }
        if (opts.startDateKey && opts.endDateKey) {
            opts.startDate = opts[opts.startDateKey];
            opts.endDate = opts[opts.endDateKey];
        }
        // 如果有开始限制时间且有开始时间初值，初值必须大于开始限制时间
        if (opts.startDate && opts.limitStart) {
            var startStamp = opts.parser.call(target, opts.startDate).getTime();
            var startLimitStamp = opts.parser.call(target, opts.limitStart).getTime();
            if (startStamp < startLimitStamp) {
                console.error('开始时间默认值必须大于开始限制时间');
                return false;
            }
        }

        // 如果有结束限制时间且有结束时间初值，初值必须小于结束限制时间
        if (opts.endDate && opts.limitEnd) {
            var endStamp = opts.parser.call(target, opts.endDate).getTime();
            var endLimitStamp = opts.parser.call(target, opts.limitEnd).getTime();
            if (endStamp > endLimitStamp) {
                console.error('结束时间默认值必须小于结束限制时间');
                return false;
            }
        }
        return true
    }

    /**
     * 有开始结束时间初值时设初值，考虑合并setValue（onshowpanel才调用，考虑函数合并）
     * @param {*} target
     */
    function initInputValue(target) {
        var state = $.data(target, 'daterangebox');
        var opts = state.options;
        if (opts.startDate && opts.endDate) {
            $(target).combo('setValue', opts.startDate + opts.rangeSeparator + opts.endDate).combo('setText', opts.startDate + opts.rangeSeparator + opts.endDate);
        }
    }
    /**
     * 如果有起始时间限制，校验左边的日历值
     * @param {*} state
     */
    function validateLeftCalendar(target) {
        var state = $.data(target, 'daterangebox');
        var opts = state.options;
        state.calendar.calendar({
            validator: function (date) {
                if (opts.limitStart) {
                    // var limitStart = new Date(opts.limitStart.replace(/-/g, '/')).getTime();
                    var limitStart = opts.parser.call(target, opts.limitStart).getTime();
                    if (date.getTime() < limitStart) {
                        return false;
                    }
                }
                if (opts.limitEnd) {
                    //var limitEnd = new Date(opts.limitEnd.replace(/-/g, '/')).getTime();
                    var limitEnd = opts.parser.call(target, opts.limitEnd).getTime();
                    if (date.getTime() > limitEnd) {
                        return false;
                    }
                }
                return true;
            },
            styler: function (date) {
                if (opts.limitStart) {
                    // var limitStart = new Date(opts.limitStart.replace(/-/g, '/')).getTime();
                    var limitStart = opts.parser.call(target, opts.limitStart).getTime();
                    if (date.getTime() < limitStart) {
                        return 'color:#cccccc'
                    }
                }
                if (opts.limitEnd) {
                    // var limitEnd = new Date(opts.limitEnd.replace(/-/g, '/')).getTime();
                    var limitEnd = opts.parser.call(target, opts.limitEnd).getTime();
                    if (date.getTime() > limitEnd) {
                        return 'color:#cccccc'
                    }
                }
                return '';
            }
        });
        $.parser.parse(state.calendar);
    }

    /**
     * 时间校验，右边的日期必须大于或等于左边的日期，如果开始限制时间、结束限制时间，则需在此时间范围内
     * @param {*} state
     * @param {*} leftTime
     */
    function validateRightCalendar(state, leftTime) {
        var opts = state.options;
        //右边的日期必须大于或等于左边的日期.
        state.calendarRight.calendar({
            validator: function (date) {
                if (opts.limitStart) {
                    // var limitStart = new Date(opts.limitStart.replace(/-/g, '/')).getTime();
                    var limitStart = opts.parser.call(target, opts.limitStart).getTime();
                    if (date.getTime() < limitStart) {
                        return false;
                    }
                }
                if (opts.limitEnd) {
                    // var limitEnd = new Date(opts.limitEnd.replace(/-/g, '/')).getTime();
                    var limitEnd = opts.parser.call(target, opts.limitEnd).getTime();
                    if (date.getTime() > limitEnd) {
                        return false;
                    }
                }
                if (date.getTime() < leftTime) {
                    return false;
                }
                return true;
            },
            styler: function (date) {
                if (opts.limitStart) {
                    // var limitStart = new Date(opts.limitStart.replace(/-/g, '/')).getTime();
                    var limitStart = opts.parser.call(target, opts.limitStart).getTime();
                    if (date.getTime() < limitStart) {
                        return 'color:#cccccc';
                    }
                }
                if (opts.limitEnd) {
                    // var limitEnd = new Date(opts.limitEnd.replace(/-/g, '/')).getTime();
                    var limitEnd = opts.parser.call(target, opts.limitEnd).getTime();
                    if (date.getTime() > limitEnd) {
                        return 'color:#cccccc';
                    }
                }
                if (date.getTime() < leftTime) {
                    return 'color:#cccccc';
                }
                return '';
            }
        });
        $.parser.parse(state.calendarRight);
    }

    /**
     * 设置左边日历的值，同时校验右边日历时间值
     * @param {*} target
     * @param {*} value
     */
    function setValueLeft(target, value) {
        var state = $.data(target, 'daterangebox');
        var opts = state.options;
        state.calendar.calendar('moveTo', opts.parser.call(target, value));
        state.leftInput.textbox('setValue', value);
        // var leftTime = new Date(value.replace(/-/g, '/')).getTime();
        var leftTime = opts.parser.call(target, value).getTime();
        // 判断如果左边的日期time > 右边输入框显示的，右边输入框清空
        var rightInputVal = state.rightInput.textbox('getValue');
        if (rightInputVal) {
            var rightTime = opts.parser.call(target, rightInputVal).getTime();
            if(leftTime > rightTime) {
                state.rightInput.textbox('setValue', '');
            }
        }
        validateRightCalendar(state, leftTime);
    }

    /**
     * 设置右边日历值
     * @param {*}} target
     * @param {*} value
     */
    function setValueRight(target, value) {
        var state = $.data(target, 'daterangebox');
        var opts = state.options;
        state.calendarRight.calendar('moveTo', opts.parser.call(target, value));
        state.rightInput.textbox('setValue', value);
        state.rightInput.textbox('textbox').parent('span').removeClass('daterangebox-alert-border');
    }

    /**
     * 设置日历值
     * @param {*} target
     * @param {*} value
     */
    function setValue(target, value) {
        var state = $.data(target, 'daterangebox');
        var opts = state.options;
        var leftVal = '',
            rightVal = '';

        if (value) {
            var valArr = value.replace(/\s+/g, "").split(opts.rangeSeparator);
            leftVal = $.trim(valArr[0]);
            rightVal = $.trim(valArr[1]);
        }
        // 设置输入框值
        state.leftInput.textbox('setValue', leftVal);
        state.rightInput.textbox('setValue', rightVal);
        // TODO 为空 当有时间限制且没有初值时，设置当前显示为limit值,
        var limitStart = "",
            limitEnd = ""
        // limitStart和limitEnd都有
        if (opts.limitStart && opts.limitEnd) {
            limitStart = opts.limitStart;
            limitEnd = opts.limitEnd;
        }
        // 如果只有limitStart，比较limitEnd = now > limitStart ? now : limitStart + 1填
        if (opts.limitStart && !opts.limitEnd) {
            limitStart = opts.limitStart;
            var startStamp = opts.parser.call(target, opts.limitStart).getTime()
            var startStampAdd = startStamp + 60 * 60 * 24 * 1000
            limitEnd = new Date().getTime() > startStamp ? opts.formatter.call(target, new Date()) : opts.formatter.call(target, new Date(startStampAdd));
        }
        // 如果只有limitEnd，比较limiyStart = now > limitEnd ? limitEnd - 1天 : now
        if (!opts.limitStart && opts.limitEnd) {
            var endStamp = opts.parser.call(target, opts.limitEnd).getTime()
            var endStampD = endStamp - 60 * 60 * 24 * 1000
            limitStart = new Date().getTime() > endStamp ? opts.formatter.call(target, new Date(endStampD)) : opts.formatter.call(target, new Date());
            limitEnd = opts.limitEnd
        }
        // 如果没有初值但有限制值，日历默认移动到限制值
        if (!leftVal && limitStart) {
            leftVal = limitStart;
        }
        if (!rightVal && limitEnd) {
            rightVal = limitEnd
        }
        var leftDate = opts.parser.call(target, leftVal);
        validateRightCalendar(state, leftDate.getTime());

        state.calendar.calendar('moveTo', leftDate);
        state.calendarRight.calendar('moveTo', opts.parser.call(target, rightVal));
    }

    /**
     * 自定义format
     */
    Date.prototype.customFormat = function (fmt) { // author: meizz
        var o = {
            "M+": this.getMonth() + 1, // 月份
            "d+": this.getDate(), // 日
            "h+": this.getHours() > 12 ? this.getHours() - 12 : this.getHours(), // 小时
            // (12)
            "H+": this.getHours(), // 小时 (24)
            "m+": this.getMinutes(), // 分
            "s+": this.getSeconds(), // 秒
            "q+": Math.floor((this.getMonth() + 3) / 3), // 季度
            "S": this.getMilliseconds()
            // 毫秒
        };
        if (/(y+)/.test(fmt))
            fmt = fmt.replace(RegExp.$1, (this.getFullYear() + "").substr(4 - RegExp.$1.length));
        for (var k in o)
            if (new RegExp("(" + k + ")").test(fmt))
                fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
        return fmt;
    }
    /**
     * 自定义customParser
     */
    function customParser(s, fmt, mode) {
        if (!s) {
            // todo 
            var date = new Date();
            var y = date.getFullYear();
            if(mode == 'Y') {
                return new Date(y, 0, 1);
            } else if (mode == 'M') {
                var m = date.getMonth();
                return new Date(y, m, 1);
            }
            return date;
        }
        
        var y = 0;
        var y_a;
        var M = 0;
        var M_a;
        var d = 0;
        var d_a;
        for (var a = 0; a < fmt.length; a++) {
            if (fmt.substr(a, 1) == 'y') {
                y++;
                y_a = a;
            } else if (fmt.substr(a, 1) == 'M') {
                M++;
                M_a = a;
            } else if (fmt.substr(a, 1) == 'd') {
                d++;
                d_a = a;
            }
        }
        var agent = navigator.userAgent.toLowerCase();
        if (agent.indexOf("firefox")) {
            if (d > 0) {
                return new Date(s.substr(y_a - y + 1, y) + '-' + s.substr(M_a - M + 1, M) + '-' + s.substr(d_a - d + 1, 20))
            } else if (M > 0) {
                return new Date(s.substr(y_a - y + 1, y) + '-' + s.substr(M_a - M + 1, M))// +'-'+s.substr(d_a-d+1,20))
            } else {
                return new Date(s.substr(y_a - y + 1, y))// +'-'+s.substr(M_a-M+1,M))//+'-'+s.substr(d_a-d+1,20))
            }
        } else {
            if (d > 0) {
                return new Date(s.substr(y_a - y + 1, y) + '/' + s.substr(M_a - M + 1, M) + '/' + s.substr(d_a - d + 1, 20))
            } else if (M > 0) {
                return new Date(s.substr(y_a - y + 1, y) + '/' + s.substr(M_a - M + 1, M))// +'-'+s.substr(d_a-d+1,20))
            } else {
                return new Date(s.substr(y_a - y + 1, y))// +'-'+s.substr(M_a-M+1,M))//+'-'+s.substr(d_a-d+1,20))
            }
        }

    }
    /**
     * 构造方法.
     */
    $.fn.daterangebox = function (options, param) {
        if (typeof options == 'string') {
            var method = $.fn.daterangebox.methods[options];
            if (method) {
                //当 method 是"daterangebox"定义的方法是,直接调用.
                return method(this, param);
            } else {
                //否则,调用combo对应的方法.
                return this.combo(options, param);
            }
        }
        options = options || {};
        return this.each(function () {
            var state = $.data(this, 'daterangebox');
            if (state) {
                $.extend(state.options, options);
            } else {
                //在元素上存放(set)数据. 除了'cloneFrom'方法外,其他地方都是获取(get).
                $.data(this, 'daterangebox', {
                    // 拷贝 $.fn.daterangebox.defaults 数据.
                    options: $.extend({}, $.fn.daterangebox.defaults, $.fn.daterangebox.parseOptions(this), options)
                });
            }
            createBox(this);
        });
    };

    $.fn.daterangebox.methods = {
        options: function (jq) {
            var copts = jq.combo('options');
            return $.extend($.data(jq[0], 'daterangebox').options, {
                width: copts.width,
                height: copts.height,
                originalValue: copts.originalValue,
                disabled: copts.disabled,
                readonly: copts.readonly
            });
        },

        //暴露给用户使用的API.获得calendar对象.
        calendar: function (jq) { // get the calendar object
            return $.data(jq[0], 'daterangebox').calendar;
        },

        initValue: function (jq, dateObj) {
            var state = $.data(jq[0], 'daterangebox');
            var opts = state.options;
            return jq.each(function () {
                // var opts = $(this).daterangebox('options');
                // var value = opts.value;
                // if (value) {
                // 	//下文有定义'formatter','parser'方法.
                // 	value = opts.formatter.call(this, opts.parser.call(this, value));
                // }
                //最终还是会调用'combo'的方法, 并且还调用'setText'方法
                if (dateObj.startDateKey && dateObj.endDateKey) {
                    dateObj.startDate = dateObj[dateObj.startDateKey];
                    dateObj.endDate = dateObj[dateObj.endDateKey];
                }
                var value = dateObj.startDate + opts.rangeSeparator + dateObj.endDate;
                $(this).combo('initValue', value).combo('setText', value);
                state.leftInput.textbox('setValue', dateObj.startDate);
                state.rightInput.textbox('setValue', dateObj.endDate);
            });
        },
        setValue: function (jq, value) {
            return jq.each(function () {
                //调用本模块定义的'setValue'函数.
                setValue(this, value);
            });
        },
        reset: function (jq) {
            return jq.each(function () {
                var opts = $(this).daterangebox('options');
                // opts.originalValue -> 来自combo -> 为空字符串.
                $(this).daterangebox('setValue', opts.originalValue);
            });
        },
        /**
         * 获取值一切以input框中为准，panel中在onshowpanel中调用，会不准
         * @param {*} jq
         */
        getDateStr: function (jq) {
            var state = $.data(jq[0], 'daterangebox');
            return $(jq).combo('getValue')
        },
        getDate: function (jq) {
            var state = $.data(jq[0], 'daterangebox');
            var opts = state.options;
            var dateObj = {};
            var dateStr = $(jq).combo('getValue')
            var leftVal = '',
                rightVal = '';
            if (dateStr) {
                var valArr = dateStr.replace(/\s+/g, '').split(opts.rangeSeparator);
                leftVal = $.trim(valArr[0]);
                rightVal = $.trim(valArr[1]);
            }
            if (opts.startDateKey && opts.endDateKey) {
                dateObj[opts.startDateKey] = leftVal;
                dateObj[opts.endDateKey] = rightVal;
                return dateObj;
            }
            return {
                startDate: leftVal,
                endDate: rightVal
            }
        }
    };

    //此方法可提供给子类使用.譬如下面的"$.fn.combo.parseOptions(target)".
    $.fn.daterangebox.parseOptions = function (target) {
        return $.extend({}, $.fn.combo.parseOptions(target), $.parser.parseOptions(target));
    };

    $.fn.daterangebox.defaults = $.extend({}, $.fn.combo.defaults, {
        mode:'D',
        width: 360,
        panelWidth: 400,
        panelHeight: 'auto',
        required: false,
        limitStart: '',
        limitEnd: '',
        separator: '/',
        rangeSeparator: '-',
        formatter: function (date) {
            if (!date) { return ''; }
            var opts = $(this).daterangebox('options');
            if(opts.mode.toUpperCase() == 'Y') {
                return date.customFormat(opts.formatDate || 'yyyy');
            }
            if(opts.mode.toUpperCase() == 'M') {
                return date.customFormat(opts.formatDate || 'yyyy-MM');
            }
            var fmt = opts.formatDate ? opts.formatDate : "yyyyMMdd";
            if (opts.separator == "") {
                return date.customFormat(fmt);
            }
            var y = date.getFullYear();
            var m = date.getMonth() + 1;
            var d = date.getDate();
            return y + opts.separator + (m < 10 ? ('0' + m) : m) + opts.separator + (d < 10 ? ('0' + d) : d);
        },
        parser: function (s) {
            var opts = $(this).daterangebox('options');
            if(opts.mode.toUpperCase() == 'Y') {
                return customParser(s, (opts.formatDate || 'yyyy'), 'Y');
            }
            if(opts.mode.toUpperCase() == 'M') {
                return customParser(s, (opts.formatDate || 'yyyy-MM'), 'M');
            }

            if (!s) return new Date();
            if (opts.separator == "") {
                var fmt = opts.formatDate ? opts.formatDate : "yyyyMMdd";
                return customParser(s, fmt, 'D');
            }
            var ss = s.split(opts.separator);
            var y = parseInt(ss[0], 10);
            var m = parseInt(ss[1], 10);
            var d = parseInt(ss[2], 10);
            if (!isNaN(y) && !isNaN(m) && !isNaN(d)) {
                return new Date(y, m - 1, d);
            } else {
                return new Date();
            }
        },
        onSelect: function (date) { }
    });
})(jQuery);