export class SurveyResponse {
  createdAt: Date;
  longAnswer: string;
  shortAnswer: ShortAnswer;
  surveyId: string;
  userId: string;
  id?: string;
}

export enum ShortAnswer {
  Yes = "Yes",
  No = "No"
}
