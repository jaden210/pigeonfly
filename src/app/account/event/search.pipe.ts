import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'eventSearch'
})
export class EventSearchPipe implements PipeTransform {


  transform(days, args?: string, people?, types?) { // TODO: this only filters by day, maybe we need to be more granular
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
          console.log(day);
          
          if (day.events.length > 0) {
            let push = false;
            logLoop:
            for (let event of day.events) {
              if (event.action.toLowerCase().includes(f.toLowerCase())) {
                push = true;
                continue logLoop;
              }
              if (event.description) {
                if (event.description.toLowerCase().includes(f.toLowerCase())) {
                  push = true;
                  continue logLoop;
                }
              }
              if (event.documentId.toLowerCase().includes(f.toLowerCase())) {
                push = true;
                continue logLoop;
              }
              if (event.type.toLowerCase().includes(f.toLowerCase())) {
                push = true;
                continue logLoop;
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
          for (let event of day.events) {
            if (person == event.userId) {
              rv.push(day);
            }
          }
        }
      } return rv;
    } else {
      return days; // empty args returns whole stores list
    }
  } else if (types) {
    if (types.length > 0) {
      for (let type of types) {
        for (let day of days) {
          for (let event of day.events) {
            if (type == event.type) {
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