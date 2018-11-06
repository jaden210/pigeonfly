export class Survey {
  oshaArticleId: string;
  receivedTraining: string[] = [];
  userId: string;
  active: boolean = true;
  createdAt: Date = new Date(new Date().setHours(0, 0, 0, 0)); // Make sure to set to midnight always
  teamId: string;
  category: string;
  title: string;
  runDaily: boolean;
  runOnceOnDate: Date;
  runOncePerUserSurvey: boolean;
  runOnDom: number[] = [];
  runOnDow: number[] = [];
  userSurvey: any = {}; // userId: ms
  id?: string;
}
