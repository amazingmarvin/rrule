import { DateWithZone } from './datewithzone';
import { iter } from './iter/index';
import dateutil from './dateutil';
// function inExdateHash(exdateHash: { [k: number]: boolean }, dt: number) {
//  for (const key in exdateHash) {
//    if (Math.abs(key - dt) <
//  }
// }
function getExdate(d) {
    return d.getDate() + 100 * d.getMonth() + 10000 * d.getFullYear();
}
export function iterSet(iterResult, _rrule, _exrule, _rdate, _exdate, tzid) {
    var _exdateHash = {};
    var _accept = iterResult.accept;
    function evalExdate(after, before) {
        _exrule.forEach(function (rrule) {
            rrule.between(after, before, true).forEach(function (date) {
                _exdateHash[getExdate(date)] = true;
            });
        });
    }
    _exdate.forEach(function (date) {
        var zonedDate = new DateWithZone(date, tzid).rezonedDate();
        _exdateHash[getExdate(zonedDate)] = true;
    });
    iterResult.accept = function (date) {
        var dt = getExdate(date);
        if (!_exdateHash[dt]) {
            _exdateHash[dt] = true;
            return _accept.call(this, date);
        }
        return true;
    };
    if (iterResult.method === 'between') {
        evalExdate(iterResult.args.after, iterResult.args.before);
        iterResult.accept = function (date) {
            var dt = getExdate(date);
            if (!_exdateHash[dt]) {
                _exdateHash[dt] = true;
                return _accept.call(this, date);
            }
            return true;
        };
    }
    for (var i = 0; i < _rdate.length; i++) {
        var zonedDate = new DateWithZone(_rdate[i], tzid).rezonedDate();
        if (!iterResult.accept(new Date(zonedDate.getTime())))
            break;
    }
    _rrule.forEach(function (rrule) {
        iter(iterResult, rrule.options);
    });
    var res = iterResult._result;
    dateutil.sort(res);
    switch (iterResult.method) {
        case 'all':
        case 'between':
            return res;
        case 'before':
            return ((res.length && res[res.length - 1]) || null);
        case 'after':
        default:
            return ((res.length && res[0]) || null);
    }
}
//# sourceMappingURL=iterset.js.map