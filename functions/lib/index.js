"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const functions = require("firebase-functions");
const admin = require('firebase-admin');
admin.initializeApp(functions.config().firebase);
exports.initUser = functions.firestore.document("invitation/{invitationId}").onCreate((snapshot) => {
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
        db.collection("invitation").document(snapshot.id).set({ status: 'accepted' });
    })
        .catch((error) => {
        console.error('There was an error while sending the email:', error);
        db.collection("invitation").document(snapshot.id).set({ status: 'error sending email' });
    });
});
//# sourceMappingURL=index.js.map