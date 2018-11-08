import * as functions from 'firebase-functions';
const admin = require('firebase-admin');
admin.initializeApp(functions.config().firebase);

exports.inviteNewUser = functions.firestore.document("invitation/{invitationId}").onCreate((snapshot) => {
  let info = snapshot.data();
  const nodemailer = require('nodemailer');
  const db = admin.firestore();
  
  const mailTransport = nodemailer.createTransport(`smtps://jaden210@gmail.com:FordGT-40@smtp.gmail.com`);    
  const mailOptions: any = {
    from: '"Compliancechimp" <support@compliancechimp.com>',
    to: info.inviteEmail,
  }
  mailOptions.subject = 'You have been invited to join ' + info.companyName + ' at Compliancechimp';
    mailOptions.html = `Hi ${info.inviteName}<br><br>
    ${info.companyName} is using Compliancechimp to manage safety training, worksite logs, record keeping, and more, as part of an ongoing commitment to safety and compliance. You've been invited to the team. Please visit the App Store or Goolge Play Store to download the free app and join your team today. Feel free to contact us at support@compliancechimp.com with any questions, and welcome!
    <br><br> <a href="https://inviteme.me/account" target="_blank">LETS GET STARTED</a>
    <br> <a href="https://inviteme.me/account" target="_blank">LETS GET STARTED</a>
    <br><br>Sincerely,
    <br><br>Alan, Client Success Team
    <br>Compliancechimp
    <br>support@compliancechimp.com`;
    
    return mailTransport.sendMail(mailOptions)
    .then(() => {
      console.log(`New invitation email sent to:` + info.inviteName)
    }) 
    .catch((error) => {
      console.error('There was an error while sending the email:', error)
    });
});

exports.newTeamEmail = functions.firestore.document("team/{teamId}").onUpdate((change, context) => {
  const db = admin.firestore();
  let oldTeam = change.before.data();
  let newTeam = change.after.data();
  const nodemailer = require('nodemailer');
  
  if ((!oldTeam.name && newTeam.name)) {
    let user;
    db.doc("user/" + newTeam.ownerId).get().then(teamUser => {
      user = teamUser.data();
      const mailTransport = nodemailer.createTransport(`smtps://jaden210@gmail.com:FordGT-40@smtp.gmail.com`);    
      const mailOptions: any = {
        from: '"Compliancechimp" <support@compliancechimp.com>',
        to: user.email,
      }
      mailOptions.subject = 'Welcome to your free 30 day trial of Compliancechimp!';
      mailOptions.html = `Hi ${user.name}<br><br>
      Glad to meet you! We want you to get the most out of Compliancechimp during these first 30 days. If you haven't already, visit the Achievements page inside your account, which walks you through the various features of the platform as an owner or administrator. Remember, Compliancechimp is largely driven from our free app which can be found here for Apple users, or here for Android users. Head over and get the app if you haven't already. As you invite your team, they'll do the same. Please take advantage of the many benefits of the platform which enable compliance, including: training your team and getting their survey responses, capturing worksite logs, performing self-inspection, and more.
      <br><br> <a href="https://inviteme.me/account" target="_blank">LETS GET STARTED</a>
      <br> <a href="https://inviteme.me/account" target="_blank">LETS GET STARTED</a>
      <br><br>Don't hesitate to contact us with any questions at support@compliancechimp.com, and enjoy!
      <br><br>Sincerely,
      <br><br>alan, Client Success Team
      <br>Compliancechimp
      <br>support@compliancechimp.com`;
      
      return mailTransport.sendMail(mailOptions)
      .then(() => {
        console.log(`New invitation email sent to:` + user.name)
      }) 
      .catch((error) => {
        console.error('There was an error while sending the email:', error)
      });
    }).catch(error => {
      console.log(error + ": no user found to send email");
      return;
    });
  }
});

exports.supportTicketSubmitted = functions.firestore.document("support/{supportId}").onCreate((snapshot) => {
  let info = snapshot.data();
  const nodemailer = require('nodemailer');
  const db = admin.firestore();
  
  const mailTransport = nodemailer.createTransport(`smtps://jaden210@gmail.com:FordGT-40@smtp.gmail.com`);    
  const mailOptions: any = {
    from: '"Compliancechimp" <support@compliancechimp.com>',
    to: info.email,
  }
  mailOptions.subject = 'We have received your message - hello from Compliancechimp';
    mailOptions.html = `Hi there<br><br>
    This is just a friendly note to say we've received your message and will respond as quickly as possible.
    <br><br>Thank you,
    <br><br>Ken, Client Support
    <br>Compliancechimp
    <br>support@compliancechimp.com`;
    
    return mailTransport.sendMail(mailOptions)
    .then(() => {
      console.log(`New invitation email sent to:` + info.email)
    }) 
    .catch((error) => {
      console.error('There was an error while sending the email:', error)
    });
});



/*    --------- ACHIEVEMENTS ----------     */

exports.achievementTeam = functions.firestore.document("team/{teamId}").onUpdate((change, context) => {
  let oldTeam = change.before.data();
  let newTeam = change.after.data();
  
  /* logoUrl achievement */
  if (!oldTeam.logoUrl && newTeam.logoUrl) {
    updateCompletedAchievement(newTeam.id, "hasCompanyLogo", true).then(() => console.log('successs')).catch(error => console.log(error));
  }
});

exports.achievementProfile = functions.firestore.document("user/{userId}").onUpdate((change, context) => {
  let oldUser = change.before.data();
  let newUser = change.after.data();
  
  /* profileUrl achievement */
  if (oldUser.accountType == "owner" && !oldUser.profileUrl && newUser.profileUrl) {
   updateCompletedAchievement(newUser.teamId, "hasOwnerProfileUrl", true).then(() => console.log('successs')).catch(error => console.log(error));
  }
});

exports.achievementLogs = functions.firestore.document("log/{id}").onCreate((snapshot) => {
  let log = snapshot.data();
  
  /* total logs achievement */
  updateCompletedAchievement(log.teamId, "logsCount", 1, true).then(() => console.log('successs')).catch(error => console.log(error));

  logAsEvent("log", log.id,log.userId,log.description,log.teamId);
});

exports.achievementTimeclocks = functions.firestore.document("timeclock/{id}").onCreate((snapshot) => {
  let timeclock = snapshot.data();
  
  /* total timeclock achievement */
  updateCompletedAchievement(timeclock.teamId, "timeclocksCount", 1, true).then(() => console.log('successs')).catch(error => console.log(error));
});

exports.achievementinvitedUsers = functions.firestore.document("invitation/{id}").onCreate((snapshot) => {
  let invitation = snapshot.data();

  /* total invites achievement */
  updateCompletedAchievement(invitation.teamId, "invitedUsers", 1, true).then(() => console.log('successs')).catch(error => console.log(error));
});

exports.achievementSelfAssesment = functions.firestore.document("self-inspection/{id}").onCreate((snapshot) => {
  let selfInspection = snapshot.data();
  
  /* total self inspections achievement */
  updateCompletedAchievement(selfInspection.teamId, "startedSelfAssesments", 1, true).then(() => console.log('successs')).catch(error => console.log(error));
});

exports.achievementFinishSelfInspection = functions.firestore.document("self-inspection/{id}").onUpdate((change, context) => {
  let oldSI = change.before.data();
  let newSI = change.after.data();
  
  /* finishSelfInspection achievement */
  newSI.selfInspections.forEach(nInspection => {
    oldSI.selfInspections.forEach(oInspection => {
      if (nInspection.completedAt !== null && oInspection.completedAt == null) { // has been completed
        updateCompletedAchievement(newSI.teamId, "completedSelfAssesments", 1, true).then(() => console.log('successs')).catch(error => console.log(error));
      }
    })
  });
});

exports.achievementInjuryReport = functions.firestore.document("injury-report/{Id}").onCreate((snapshot) => {
  let injuryReport = snapshot.data();
  
  /* total self inspections achievement */
  updateCompletedAchievement(injuryReport.teamId, "injuryReports", 1, true).then(() => console.log('successs')).catch(error => console.log(error));
});


function updateCompletedAchievement(teamId: string, mapKey: string, value: any, sum?: boolean): Promise<any> {
  return admin.firestore().collection("completed-achievement").where("teamId", "==", teamId)
    .get()
    .then((querySnapshot) => {
        querySnapshot.forEach((doc) => {
          const docData = doc.data();
          let obj = {};
          obj[mapKey] = sum ? docData[mapKey] + value : value;
          return admin.firestore().doc("completed-achievement/" + doc.id).update(obj)
          .then(() => console.log(mapKey + " has been updated in completed-achievement"))
          .catch(error => console.log(error));
        });
    })
    .catch(function(error) {
        console.log("Error getting documents: ", error);
    });
}

/*  ---------- EVENTS ----------  */

function logAsEvent(type: string, documentId: string, userId: string, title: string, teamId: string): Promise<any> {
  let nd = new Date();
  return admin.firestore().collection("event").add(
    { type, documentId, userId, title, createdAt: nd, teamId }
  )
  .then(() => console.log("new Event recorded"))
  .catch(error => console.log(error));
}
