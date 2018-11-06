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
  mailOptions.subject = 'You’re a new member of  Compliancechimp with ' + info.companyName + ' - Please see how to join your team below.';
    mailOptions.html = `Hi ${info.inviteName}<br><br>
    ${info.companyName} is using Compliancechimp to manage time tracking, worksite logs, and safety training. Please visit the App Store or Goolge Play Stopre to download the free app and join your team now.
    <br><br> <a href="https://inviteme.me/account" target="_blank">LETS GET STARTED</a>
    <br> <a href="https://inviteme.me/account" target="_blank">LETS GET STARTED</a>
    <br><br>Compliancechimp enables a safer workplace, and streamlines key activities for your team and leadership. Although it is completely mobile, once you have downloaded the app and joined your team, you can also visit Complilancechimp online at https://compliancechimp.com.
    <br><br>Sincerely,
    <br><br>MiKayla, Client Success Team
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