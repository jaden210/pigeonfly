import { Pipe, PipeTransform } from "@angular/core";
import { User } from "./account/account.service";

@Pipe({ name: "userName" })
export class UserNamePipe implements PipeTransform {
  transform(userId: string, users: User[]): string {
    const user =
      users && users.length ? users.find(user => user.uid == userId) : null;
    return user ? user.name : null;
  }
}
