import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'search'
})
export class SearchPipe implements PipeTransform {


  transform(days, args?: string, people?) {
    let filter: string[] = args ? args.trim().split(/\s+/) : null;
    let rv: any[] = [];

    if (filter) {
      cardLoop: // loop variable
      for (let day of days) {
        for (let f of filter) { // for value of filter array, built from arguments passed in
          if (day.dOW.toLowerCase().includes(f.toLowerCase())) { // convert to lower case, compare keyword to f
              rv.push(day); // append matching store to results[]
              continue cardLoop; // if block true, run filters loop again
          }
          if (day.day) {
              if (day.day.includes(f)) { // convert to lower case, compare keyword to f
                  rv.push(day); // append matching store to results[]
                  continue cardLoop; // if block true, run filters loop again
              }
          }
          if (day.month) {
              if (day.month.includes(f)) { // convert to lower case, compare keyword to f
                  rv.push(day); // append matching store to results[]
                  continue cardLoop; // if block true, run filters loop again
              }
          }
          if (day.logs && day.logs.length > 0) {
            let push = false;
            logLoop:
            for (let log of day.logs) {
              if (log.id.toLowerCase().includes(f.toLowerCase())) {
                push = true;
                continue logLoop;
              }
              if (log.description.toLowerCase().includes(f.toLowerCase())) {
                push = true;
                continue logLoop;
              }
            };
            push ? rv.push(day) : null; // append matching store to results[]
            continue cardLoop; // if block true, run filters loop again
          }
          if (day.timeLogs && day.timeLogs.length > 0) {
            let push = false;
            timeLoop:
            for (let log of day.timeLogs) {
              if (log.id.toLowerCase().includes(f.toLowerCase())) {
                push = true;
                continue timeLoop;
              }
            };
            push ? rv.push(day) : null; // append matching store to results[]
            continue cardLoop; // if block true, run filters loop again
          }
        }
    } return rv;
  } else if (people) {
    if (people.length > 0) {
      for (let person of people) {
        for (let day of days) {
          for (let logger of day.loggers) {
            if (person == logger.id) {
              rv.push(day);
            }
          }
        }
      } return rv;
    } else {
      return days; // empty args returns whole stores list
    }
  } else {
    return days; // empty args returns whole stores list
  }
}
}