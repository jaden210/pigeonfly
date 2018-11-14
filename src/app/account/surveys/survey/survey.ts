export class Survey {
  oshaArticleId: string;
  receivedTraining: string[] = [];
  userId: string;
  active: boolean = true;
  createdAt: Date = new Date();
  teamId: string;
  category: string;
  title: string;
  runDate: Date = new Date();
  userSurvey: any = {}; // userId: ms
  id?: string;
}
