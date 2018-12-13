import { Injectable} from "@angular/core";

@Injectable({
  providedIn: "root"
})
export class HelperService {
  
  helperProfiles = {
    feedback: {
      name: "How can we do better?",
      description: ""
    },
    team: {
      name: "Team",
      description:
        "This page allows you to interpret compliance companywide within 15 seconds thanks to quick data cards. You’ll also you manage your team from this page. That is, invite and remove members, grant permission levels, see individual compliance, and so on.<br><br>Step 1<br>Invite everyone on your team by clicking the orange “New Team Member” button to the right. Each person you invite will receive an email with instructions to download the free app and join your team. Once joined, they participate in everything our app has to offer which allows you to gauge training down to the individual. Please invite your entire team today and ensure as your team grows or changes, that new members are invited from here.<br><br>Step 2<br>Each data card gives you insight into the compliance health of your organization, and takes only a few seconds to assess your current state. If you were air traffic control, this would be your control tower. Your goals should be to keep Company training at 100%, Members needing training at zero, Self inspections at zero expired, Badges earned at 100%, and Compliance level at 3 which is the highest level."
    },
    achievement: {
      name: "Badges",
      description:
      "This page is designed to help you gain the benefits of Compliancechimp as quickly as possible. Compliancechimp is a thorough and powerful platform which improves safety and protects businesses. But those benefits only come if it gets used. Begin earning badges today. When you click on any badge, you’ll be taken to the page where you can accomplish the task. Some badges are self-assessment questions only which reset after 180 days. Your compliance level coincides with earning these badges."
    },
    training: {
      name: "Training",
      description:
      "The difference between each of your workers making it home tonight, or not, could be the next safety training. And the difference between passing an OSHA audit or not, is proof that the training occurred.<br><br>We’ve curated and organized OSHA safety content as the most fundamental starting point. Your opportunity is to go through the available training articles and select the ones that are relevant to your operation. Click 'CUSTOMIZE MY TRAINING' to access all training articles. When you heart an article, it will become available to each of your workers within the app on their phone. Each training shows the estimated time commitment to give, but remember this is only an estimate. Training can go longer or shorter based on your specific needs.<br><br>And training doesn’t stop with OSHA content. We’ve opened the training platform up for you to add your own training materials as well. Use this training page to build topics and articles and make them available to your entire team. Your special circumstance and processes require specialized training, and you can lock it all in, here.<br><br>Click on any of the stats bars above to be taken to your My Content page which is essentially your curated library. From a compliance perspective, giving safety training is key to keeping workers safe. But proving you’ve given training is the key to protecting your business in an OSHA audit. By always initiating training through the mobile app, or by clicking on Start Training from within any article here on the web, you lock down an authoritative record of what training was given, when, and to who. And it’s stored forever in one consolidated, simple place.<br><br>Compliancechimp’s training platform is powerful, and we encourage you to take full advantage of it."
    },
    survey: {
      name: "Surveys",
      description:
      "Part of the magic of Compliancechimp is first-person surveys. The simplicity in this approach eliminates paper tracking shouldered by supervisors or other trainers, and it certifies that training actually occurred, down to the individual, as validated by the individual themselves.<br><br>Every time a training is given, a survey automatically goes out to each member of the team that participated. They can answer yes or no to whether or not they received the training, and add comments.<br><br>Individual validation is the most responsible way to understand the training gaps that exist in your organization, so you can correct them.<br><br>And these surveys go even further. You can create a custom survey at any time and send it to any person, group, or the entire team. Find out first-person if your workers have performed the inspections they are responsible for, if they have the personal protective equipment they need, and anything else you can think of. The power of the survey is that it is always first-person, and it is tracked and stored forever."
    },
    selfInspection: {
      name: "Self-Inspection",
      description:
        "The most important preventive measure any business takes to protect its workers, is ensuring the workplace itself is safe. No amount of training can compensate for an unsafe work environment. Our self-inspection process helps you identify risks, and address them. Click the 'New Self-Inspection' button to the right to create a new self inspection. You can create as many as you’d like, covering any number of locations or worksites, and return and perform each inspection as often as is responsible to ensure the worksite is safe.<br><br>The result of every inspection can be exported to a simple PDF which shows the areas that need addressed."
    },
    log: {
      name: "Logs",
      description:
        "Using the app, any member of your team can create worksite logs, including pictures and text. Logs can include everything from periodic progress and work accomplished, to client change orders and project updates, to incidents, injuries, near misses, safety concerns, or other noteworthy happenings. Worksite logs build the historical record which is called upon in the event of an OSHA audit or inspection. Aside from that, worksite logs create a living journal of the work your business accomplishes over time, all in one central and searchable place, forever."
    },
    time: {
      name: "Time",
      description:
        "Using the mobile app, anyone can track time. Each time event is recorded here so that you have a historical record. Time can be exported at any time, for anyone, which makes calculating payroll a breeze. Administrators can adjust time as necessary by clicking on any time log and editing it. Forget paperwork and workers trying to rely on memory. Use the time clock instead."
    },
    incidentReport: {
      name: "Incident Reports",
      description:
        "Compliancechimp puts injury and near miss reporting, along with the accompanying investigation, right in the hands of every worker. From the Account page in the mobile app, anyone can report an injury or near miss, including pictures and signature. Each report flows here, where they are stored safely, forever. This turns an otherwise obscure and process laden requirement into something very accessible to every worker, which is massively important in the event of an inspection or audit. These reports create what is known as the 300 Log."
    },
    event: {
      name: "Events",
      description:
        "Every time any member of your team uses the Compliancechimp app for anything (worksite log, training, training surveys, time clock, injury report, etc), it creates what we can events. Events are noteworthy occurrences that should be recorded. So, we record them here in the Events page. Think of this as the continual stream of consciousness of your team’s activity. Why does this page exist? The answer is simple: proof of compliance.<br><br>One of the most difficult parts of compliance is paperwork, or evidence of compliance. We take the hassle completely out of it. When your team uses the Compliancechimp app to its potential, the Events page gives you a very simple, clean, consolidated, and searchable record of activity that goes back as far as the day you signed up. It’s the critical backstop in the event of an audit, and can provide additional insights to your business along the way."
    },
    account: {
      name: "Your Account",
      description:
        "Please ensure all information is filled out across all areas of your account, even down to your company logo and profile picture. These small touches make a big difference to your workers, and they’ll take only a few seconds to complete. Your account holds personal details, business details, and billing and payment details."
    }
  };

  constructor() {}
}

export class Helper {
  name: string;
  description: string;
}