export class Survey {
  id: string;
  teamId: string;
  createdAt: Date;
  title: string;
  category: string;
  active: boolean;
  runType: string;
  types: any = {
    daily: true,
    dow: [],
    dom: [],
    date: new Date(),
    once: true
  };
  userSurvey: any = {}; // map of {userId: (survey id || 0)}
  inAttendance: string[] = [];
  userId: string; // who sent the survey
  OSHAArticleId?: string;
}
