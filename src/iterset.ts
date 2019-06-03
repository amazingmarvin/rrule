import IterResult from './iterresult'
import RRule from './rrule'
import { DateWithZone } from './datewithzone'
import { iter } from './iter/index'
import dateutil from './dateutil'
import { QueryMethodTypes, IterResultType } from './types'

// function inExdateHash(exdateHash: { [k: number]: boolean }, dt: number) {
//  for (const key in exdateHash) {
//    if (Math.abs(key - dt) <
//  }
// }

function getExdate (d: Date): number {
  return d.getDate() + 100 * d.getMonth() + 10000 * d.getFullYear()
}

export function iterSet <M extends QueryMethodTypes> (
  iterResult: IterResult<M>,
  _rrule: RRule[],
  _exrule: RRule[],
  _rdate: Date[],
  _exdate: Date[],
  tzid: string | undefined
) {
  const _exdateHash: { [k: number]: boolean } = {}
  const _accept = iterResult.accept

  function evalExdate (after: Date, before: Date) {
    _exrule.forEach(function (rrule) {
      rrule.between(after, before, true).forEach(function (date) {
        _exdateHash[getExdate(date)] = true
      })
    })
  }

  _exdate.forEach(function (date) {
    const zonedDate = new DateWithZone(date, tzid).rezonedDate()
    _exdateHash[getExdate(zonedDate)] = true
  })

  iterResult.accept = function (date) {
    const dt = getExdate(date)
    if (!_exdateHash[dt]) {
      _exdateHash[dt] = true
      return _accept.call(this, date)
    }
    return true
  }

  if (iterResult.method === 'between') {
    evalExdate(iterResult.args.after!, iterResult.args.before!)
    iterResult.accept = function (date) {
      const dt = getExdate(date)
      if (!_exdateHash[dt]) {
        _exdateHash[dt] = true
        return _accept.call(this, date)
      }
      return true
    }
  }

  for (let i = 0; i < _rdate.length; i++) {
    const zonedDate = new DateWithZone(_rdate[i], tzid).rezonedDate()
    if (!iterResult.accept(new Date(zonedDate.getTime()))) break
  }

  _rrule.forEach(function (rrule) {
    iter(iterResult, rrule.options)
  })

  const res = iterResult._result
  dateutil.sort(res)
  switch (iterResult.method) {
    case 'all':
    case 'between':
      return res as IterResultType<M>
    case 'before':
      return ((res.length && res[res.length - 1]) || null) as IterResultType<M>
    case 'after':
    default:
      return ((res.length && res[0]) || null) as IterResultType<M>
  }
}
