import { Pipe, PipeTransform } from "@angular/core";
import { MyContent } from "../training.service";

@Pipe({
  name: "myContentSearch"
})
export class MyContentSearchPipe implements PipeTransform {
  transform(myContent: MyContent[], searchTerm?: string, complianceType?) {
    myContent = myContent || [];
    let searchTerms: string[] = searchTerm
      ? searchTerm.trim().split(/\s+/)
      : [];
    let rv: any[] = [];

    if (searchTerms || complianceType) {
      for (const content of myContent) {
        if (
          complianceType == "inCompliance" &&
          content.complianceLevel >= 100
        ) {
          rv.push(content);
        } else if (
          complianceType == "outOfCompliance" &&
          content.complianceLevel < 100
        ) {
          rv.push(content);
        } else {
          for (let f of searchTerms) {
            // for value of filter array, built from arguments passed in
            if (content.articleName.toLowerCase().includes(f.toLowerCase())) {
              // convert to lower case, compare keyword to f
              rv.push(content); // append matching store to results[]
            }
          }
        }
      }
    }
    return rv.length ? rv : myContent;
  }
}
