"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const functions = require("firebase-functions");
const admin = require('firebase-admin');
admin.initializeApp(functions.config().firebase);
exports.inviteUser = functions.firestore.document("invitation/{invitationId}").onCreate((snapshot) => {
    let info = snapshot.data();
    const nodemailer = require('nodemailer');
    const db = admin.firestore();
    const mailTransport = nodemailer.createTransport(`smtps://jaden210@gmail.com:books2011@smtp.gmail.com`);
    const mailOptions = {
        from: '"minute" <support@minute.me>',
        to: info.inviteEmail,
    };
    mailOptions.subject = 'You’re a new member of  Minute with ' + info.companyName + ' - Please see how to join your team below.';
    mailOptions.html = `Hi ${info.inviteName}<br><br>
    ${info.companyName} is using Minute to manage time tracking, worksite logs, and safety training. Please visit the App Store or Goolge Play Stopre to download the free app and join your team now.
    <br><br> <a href="https://inviteme.me/account" target="_blank">LETS GET STARTED</a>
    <br> <a href="https://inviteme.me/account" target="_blank">LETS GET STARTED</a>
    <br><br>Minute enables a safer workplace, and streamlines key activities for your team and leadership. Although it is completely mobile, once you have downloaded the app and joined your team, you can also visit Minute online at www.minuteteams.com to login and see your information. Welcome to Minute!
    <br><br>Sincerely,
    <br><br>MiKayla, Client Success Team
    <br>Minute
    <br>support@minuteteams.com`;
    return mailTransport.sendMail(mailOptions)
        .then(() => {
        console.log(`New invitation email sent to:` + info.inviteName);
        db.document("invitation/" + snapshot.id).set({ status: 'accepted' });
    })
        .catch((error) => {
        console.error('There was an error while sending the email:', error);
        db.document("invitation/" + snapshot.id).set({ status: 'error sending email' });
    });
});
/*    --------- ACHIEVEMENTS ----------     */
exports.achievementTeam = functions.firestore.document("team/{teamId}").onUpdate((change, context) => {
    let oldTeam = change.before.data();
    let newTeam = change.after.data();
    /* logoUrl achievement */
    if (!oldTeam.logoUrl && newTeam.logoUrl) {
        this.updateCompletedAchievement(newTeam.id, "hasCompanyLogo", true);
    }
});
exports.achievementProfile = functions.firestore.document("user/{userId}").onUpdate((change, context) => {
    let oldUser = change.before.data();
    let newUser = change.after.data();
    /* profileUrl achievement */
    if (!oldUser.profileUrl && newUser.profileUrl) {
        this.updateCompletedAchievement(newUser.teamId, "hasOwnerProfileUrl", true);
    }
});
exports.achievementLogs = functions.firestore.document("logs/{Id}").onCreate((snapshot) => {
    let log = snapshot.data();
    /* total logs achievement */
    this.updateCompletedAchievement(log.teamId, "logsCount", 1, true);
});
exports.achievementTimeclocks = functions.firestore.document("timeclock/{Id}").onCreate((snapshot) => {
    let timeclock = snapshot.data();
    /* total timeclock achievement */
    this.updateCompletedAchievement(timeclock.teamId, "timeclocksCount", 1, true);
});
exports.achievementinvitedUsers = functions.firestore.document("invitation/{Id}").onCreate((snapshot) => {
    let invitation = snapshot.data();
    /* total invites achievement */
    this.updateCompletedAchievement(invitation.teamId, "invitedUsers", 1, true);
});
exports.achievementSelfAssesment = functions.firestore.document("self-inspection/{Id}").onCreate((snapshot) => {
    let selfInspection = snapshot.data();
    /* total self inspections achievement */
    this.updateCompletedAchievement(selfInspection.teamId, "startedSelfAssesments", 1, true);
});
exports.achievementFinishSelfInspection = functions.firestore.document("self-inspection/{id}").onUpdate((change, context) => {
    let oldSI = change.before.data();
    let newSI = change.after.data();
    /* finishSelfInspection achievement */
    newSI.selfInspections.forEach(nInspection => {
        oldSI.selfInspections.forEach(oInspection => {
            if (nInspection.completedAt !== null && oInspection.completedAt == null) { // has been completed
                this.updateCompletedAchievement(newSI.teamId, "completedSelfAssesments", 1, true);
            }
        });
    });
});
exports.achievementInjuryReport = functions.firestore.document("injury-report/{Id}").onCreate((snapshot) => {
    let injuryReport = snapshot.data();
    /* total self inspections achievement */
    this.updateCompletedAchievement(injuryReport.teamId, "injuryReports", 1, true);
});
function updateCompletedAchievement(teamId, key, value, sum) {
    const db = admin.firestore();
    db.collection("completed-achievement").where("teamId", "==", teamId).get()
        .then(querySnapshot => {
        querySnapshot.forEach(doc => {
            let document = doc.data();
            doc.set({
                key: sum ? document[key] + value : value
            }).then(() => console.log("profile achievement completed"));
        });
    })
        .catch(error => {
        console.log("Error getting documents: ", error);
    });
}
//# sourceMappingURL=index.js.map