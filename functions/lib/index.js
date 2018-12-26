"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const functions = require("firebase-functions");
const moment = require("moment");
const admin = require("firebase-admin");
admin.initializeApp(functions.config().firebase);
admin.firestore().settings({ timestampsInSnapshots: true });
const stripe = require("stripe")(functions.config().stripe.token);
// When a user is created, register them with Stripe
exports.createStripeCustomer = functions.auth.user().onCreate(user => {
    return stripe.customers
        .create({
        email: user.email,
        description: "new Customer"
    })
        .then(customer => {
        return admin
            .firestore()
            .collection("team")
            .where("ownerId", "==", user.uid)
            .get()
            .then(querySnapshot => {
            querySnapshot.forEach(doc => {
                // should only be one, can't think of a better way
                return admin
                    .firestore()
                    .doc("team/" + doc.id)
                    .update({ stripeCustomerId: customer.id });
            });
        })
            .catch(error => {
            return console.log("Error getting documents: ", error);
        });
    });
});
exports.customerEnteredCC = functions.firestore
    .document("team/{teamId}")
    .onUpdate((change, context) => {
    let oldT = change.before.data();
    let newT = change.after.data();
    if (!oldT.cardToken && newT.cardToken) {
        // first time card enter
        stripe.customers
            .update(newT.stripeCustomerId, {
            source: newT.cardToken.id
        })
            .then(customer => {
            const days = moment().diff(moment(newT.createdAt.toDate()), "days");
            stripe.subscriptions
                .create({
                customer: customer.id,
                trial_period_days: days < 0 ? 0 : days,
                items: [
                    { plan: "small-teams" } // small teams
                ]
            })
                .then(subscription => {
                admin
                    .firestore()
                    .doc(`team/${change.after.id}`)
                    .update({
                    stripeSubscriptionId: subscription.id,
                    stripePlanId: "small-teams"
                });
                console.log(`customer ${customer.id} subscribed to small teams`);
            }, error => console.log(`error: ${error}`));
        });
    }
    else if (oldT.cardToken !== newT.cardToken) {
        // updated CC
        stripe.customers
            .update(newT.stripeCustomerId, {
            source: newT.cardToken.id
        })
            .then(() => console.log(`customer card updated`), error => console.log(`error: ${error}`));
    }
});
exports.setStripePlan = functions.https.onRequest((req, res) => {
    const body = req.body;
    const newPlan = body.plan;
    const subscriptionId = body.stripeSubscriptionId;
    const quantity = body.stripeQuantity;
    stripe.subscriptions.retrieve(subscriptionId).then(subscription => {
        stripe.subscriptions
            .update(subscriptionId, {
            cancel_at_period_end: false,
            items: [
                {
                    id: subscription.items.data[0].id,
                    plan: newPlan,
                    quantity: quantity || 1
                }
            ]
        })
            .then(charge => {
            res.status(200).send("Success");
        })
            .catch(err => {
            res.status(500).send(err);
        });
    });
});
exports.getCustomerInvoices = functions.https.onRequest((req, res) => {
    const body = req.body;
    const teamId = body.teamId;
    const stripeCustomerId = body.stripeCustomerId;
    stripe.invoices
        .list({
        customerId: stripeCustomerId
    })
        .then(list => {
        admin
            .firestore()
            .doc(`team/${teamId}`)
            .update({ stripeInvoices: list, stripeInvoicesRetrievedAt: new Date() })
            .then(() => {
            res.status(200).send("Success");
        });
    })
        .catch(err => {
        res.status(500).send(err);
    });
});
exports.inviteNewUser = functions.firestore
    .document("invitation/{invitationId}")
    .onCreate(snapshot => {
    let info = snapshot.data();
    const nodemailer = require("nodemailer");
    const db = admin.firestore();
    const mailTransport = nodemailer.createTransport(`smtps://support@compliancechimp.com:thechimpishere@smtp.gmail.com`);
    const mailOptions = {
        from: '"Compliancechimp" <support@compliancechimp.com>',
        to: info.inviteEmail
    };
    mailOptions.subject =
        "You have been invited to join " +
            info.companyName +
            " at Compliancechimp";
    mailOptions.html = `Hi ${info.inviteName}<br><br>
  ${info.companyName} is using Compliancechimp to manage safety training, worksite logs, record keeping, and more, as part of an ongoing commitment to safety and compliance. You've been invited to the team using ${info.inviteEmail}. Please visit the App Store or Goolge Play Store to download the free app and join your team today. Feel free to contact us at support@compliancechimp.com with any questions, and welcome!
  <br><br> <a href='https://play.google.com/store/apps/details?id=com.betterspace.complianceChimp&pcampaignid=MKT-Other-global-all-co-prtnr-py-PartBadge-Mar2515-1'>Get it on Google Play</a>
  <a href="https://itunes.apple.com/us/app/compliancechimp/id1445077154?mt=8" target="_blank">Download On The App Store</a>
    <br><br>Sincerely,
    <br><br>Alan, Client Success Team
    <br>Compliancechimp
    <br>support@compliancechimp.com`;
    return mailTransport
        .sendMail(mailOptions)
        .then(() => {
        console.log(`New invitation email sent to:` + info.inviteName);
    })
        .catch(error => {
        console.error("There was an error while sending the email:", error);
    });
});
// <img style="height:40px" alt='Get it on Google Play' src='https://play.google.com/intl/en_us/badges/images/generic/en_badge_web_generic.png'/>
// <img src="https://ci3.googleusercontent.com/proxy/g1y2q1E32rMt83ssyVpqp3ZQPEoac4P1Fiwb5hhuEinR4h1xf_AXPCtR1CG-C8WpRQGTpcyC_E1252Gc_NG-g008x9PlGLIKoOJcMGyAVwRZptSn0X-HTfuWcf23tcOWT6pdITnr87pYlODzJTRRlKQIMNKvbhN0JA=s0-d-e1-ft" alt="Download On The App Store" border="0"; style="max-width:100%;height: 29px;margin-bottom: 5px;">
// <img style="height:40px" alt='Get it on Google Play' src='https://play.google.com/intl/en_us/badges/images/generic/en_badge_web_generic.png'/>
// <img src="https://ci3.googleusercontent.com/proxy/g1y2q1E32rMt83ssyVpqp3ZQPEoac4P1Fiwb5hhuEinR4h1xf_AXPCtR1CG-C8WpRQGTpcyC_E1252Gc_NG-g008x9PlGLIKoOJcMGyAVwRZptSn0X-HTfuWcf23tcOWT6pdITnr87pYlODzJTRRlKQIMNKvbhN0JA=s0-d-e1-ft" alt="Download On The App Store" border="0" style="max-width:100%;height: 29px;margin-bottom: 5px;">
exports.newTeamEmail = functions.firestore
    .document("team/{teamId}")
    .onCreate((change, context) => {
    const db = admin.firestore();
    let newTeam = change.data();
    const nodemailer = require("nodemailer");
    let user;
    db.doc("user/" + newTeam.ownerId)
        .get()
        .then(teamUser => {
        user = teamUser.data();
        const mailTransport = nodemailer.createTransport(`smtps://support@compliancechimp.com:thechimpishere@smtp.gmail.com`);
        const mailOptions = {
            from: '"Compliancechimp" <support@compliancechimp.com>',
            to: user.email
        };
        mailOptions.subject =
            "Welcome to your free 30 day trial of Compliancechimp!";
        mailOptions.html = `Hi ${user.name}<br><br>
      Glad to meet you! We want you to get the most out of Compliancechimp during these first 30 days. If you haven't already, visit the Badges page inside your account, which walks you through the various features of the platform as an owner or administrator. Remember, Compliancechimp is largely driven from our free app which can be found below. Head over and get the app if you haven't already. As you invite your team, they'll do the same. Please take advantage of the many benefits of the platform which enable compliance, including: training your team and getting their survey responses, capturing worksite logs, performing self-inspection, and more.
      <br><br> <a href='https://play.google.com/store/apps/details?id=com.betterspace.complianceChimp&pcampaignid=MKT-Other-global-all-co-prtnr-py-PartBadge-Mar2515-1'>Get it on Google Play</a>
      <a href="https://itunes.apple.com/us/app/compliancechimp/id1445077154?mt=8" target="_blank">Download On The App Store</a>
      <br><br>Don't hesitate to contact us with any questions at support@compliancechimp.com, and enjoy!
      <br><br>Sincerely,
      <br><br>Alan, Client Success Team
      <br>Compliancechimp
      <br>support@compliancechimp.com`;
        return mailTransport
            .sendMail(mailOptions)
            .then(() => {
            console.log(`New Team email sent to:` + user.name);
        })
            .catch(error => {
            console.error("There was an error while sending the email:", error);
        });
    })
        .catch(error => {
        console.log(error + ": no user found to send email");
        return;
    });
});
exports.supportTicketSubmitted = functions.firestore
    .document("support/{supportId}")
    .onCreate(snapshot => {
    let info = snapshot.data();
    const nodemailer = require("nodemailer");
    const db = admin.firestore();
    const mailTransport = nodemailer.createTransport(`smtps://support@compliancechimp.com:thechimpishere@smtp.gmail.com`);
    const mailOptions = {
        from: '"Compliancechimp" <support@compliancechimp.com>',
        to: info.email
    };
    mailOptions.subject =
        "We have received your message - hello from Compliancechimp";
    mailOptions.html = `Hi there<br><br>
    This is just a friendly note to say we've received your message and will respond as quickly as possible.
    <br><br>Thank you,
    <br><br>Ken, Client Support
    <br>Compliancechimp
    <br>support@compliancechimp.com`;
    return mailTransport
        .sendMail(mailOptions)
        .then(() => {
        console.log(`New invitation email sent to:` + info.email);
    })
        .catch(error => {
        console.error("There was an error while sending the email:", error);
    });
});
exports.teamDisabled = functions.firestore
    .document("team/{teamId}")
    .onUpdate((change, context) => {
    let oldTeam = change.before.data();
    let newTeam = change.after.data();
    if (oldTeam.disabled == false && newTeam.disabled == true) {
        const nodemailer = require("nodemailer");
        const db = admin.firestore();
        let disabledAt = newTeam.disabledAt.toDate();
        const mailTransport = nodemailer.createTransport(`smtps://support@compliancechimp.com:thechimpishere@smtp.gmail.com`);
        const mailOptions = {
            from: '"Compliancechimp" <support@compliancechimp.com>',
            to: "support@compliancechimp.com"
        };
        mailOptions.subject = `${newTeam.name} has deleted their account`;
        mailOptions.html = `Looks like ${newTeam.name} decided to leave. The team has been disabled and on ${disabledAt}. 
    If you want to contact them their phone number is: ${newTeam.phone}`;
        return mailTransport.sendMail(mailOptions).catch(error => {
            console.error("There was an error while sending the email:", error);
        });
    }
    else if (oldTeam.disabled == true && newTeam.disabled == false) {
        const nodemailer = require("nodemailer");
        const db = admin.firestore();
        const mailTransport = nodemailer.createTransport(`smtps://support@compliancechimp.com:thechimpishere@smtp.gmail.com`);
        const mailOptions = {
            from: '"Compliancechimp" <support@compliancechimp.com>',
            to: "support@compliancechimp.com"
        };
        mailOptions.subject = `${newTeam.name} has re-activated their account`;
        mailOptions.html = `Looks like ${newTeam.name} decided to come back. If you want to contact them their phone number is: ${newTeam.phone}`;
        return mailTransport.sendMail(mailOptions).catch(error => {
            console.error("There was an error while sending the email:", error);
        });
    }
});
/* ----- LOGS ----- */
exports.createdLog = functions.firestore
    .document("team/{teamId}/log/{logId}")
    .onCreate((snapshot, context) => {
    let doc = snapshot.data();
    const event = logAsEvent(EventType.log, EventAction.created, snapshot.id, doc.userId, doc.description, context.params.teamId);
    const achievement = updateCompletedAchievement(context.params.teamId, "logsCount", 1, true);
    return Promise.all([event, achievement]).then(() => console.log("create logs complete"));
});
exports.modifiedLog = functions.firestore
    .document("team/{teamId}/log/{logId}")
    .onUpdate((change, context) => {
    let newDoc = change.after.data();
    return logAsEvent(EventType.log, EventAction.updated, change.after.id, newDoc.updatedId, newDoc.description, context.params.teamId).then(() => console.log("update logs complete"));
});
exports.deletedLog = functions.firestore
    .document("team/{teamId}/log/{logId}")
    .onDelete((snapshot, context) => {
    let doc = snapshot.data();
    return logAsEvent(EventType.log, EventAction.deleted, snapshot.id, doc.userId, doc.description, context.params.teamId).then(() => console.log("delete logs complete"));
});
/* ----- TEAM ----- */
exports.updateTeam = functions.firestore
    .document("team/{teamId}")
    .onUpdate((change, context) => {
    let oldTeam = change.before.data();
    let newTeam = change.after.data();
    /* billing achievement */
    let billing;
    if (!oldTeam.cardToken && newTeam.cardToken) {
        billing = updateCompletedAchievement(newTeam.id, "hasBillingInfo", true);
    }
    let address;
    if (!oldTeam.street && newTeam.street) {
        address = updateCompletedAchievement(context.params.teamId, "hasContactInfo", true);
    }
    /* logoUrl achievement */
    let logo;
    if (!oldTeam.logoUrl && newTeam.logoUrl) {
        logo = updateCompletedAchievement(newTeam.id, "hasCompanyLogo", true);
    }
    Promise.all([billing, logo, address]).then(() => console.log("update team complete"));
});
/* ----- USER ----- */
exports.userCreated = functions.firestore
    .document("user/{userId}")
    .onCreate(snapshot => {
    let user = snapshot.data();
    return null;
});
exports.userChange = functions.firestore
    .document("user/{userId}")
    .onUpdate((change, context) => {
    let oldUser = change.before.data();
    let newUser = change.after.data();
    return null;
});
/* ----- TIMECLOCKS ----- */
exports.createdTimeclock = functions.firestore
    .document("team/{teamId}/timeclock/{id}")
    .onCreate((snapshot, context) => {
    let timeclock = snapshot.data();
    const event = logAsEvent(EventType.timeclock, EventAction.created, snapshot.id, timeclock.userId, "Clocked-in", context.params.teamId);
    const achievement = updateCompletedAchievement(context.params.teamId, "timeclocksCount", 1, true);
    return Promise.all([event, achievement]).then(() => console.log("create timeclock complete"));
});
exports.modifiedTimeclock = functions.firestore
    .document("team/{teamId}/timeclock/{id}")
    .onUpdate((change, context) => {
    let oldTime = change.before.data();
    let newTime = change.after.data();
    const array = [];
    if (!oldTime.clockedOut && newTime.clockedOut) {
        let event = logAsEvent(EventType.timeclock, EventAction.created, change.after.id, newTime.userId, "Clocked-in", context.params.teamId);
        array.push(event);
    }
    if (!oldTime.updatedId && newTime.updatedId) {
        let updatedEvent = logAsEvent(EventType.timeclock, EventAction.updated, change.after.id, newTime.updatedId, "modified a timeclock", context.params.teamId);
        array.push(updatedEvent);
    }
    Promise.all(array).then(() => console.log("updated timeclock complete"));
});
/* ----- INVITATIONS ----- */
exports.createdInvitation = functions.firestore
    .document("invitation/{id}")
    .onCreate(snapshot => {
    let invitation = snapshot.data();
    let promises = [];
    promises.push(logAsEvent(EventType.member, EventAction.created, snapshot.id, invitation.invitedBy, `${invitation.inviteName} was invited to the Team`, invitation.teamId || null));
    /* total invites achievement */
    promises.push(updateCompletedAchievement(invitation.teamId, "invitedUsers", 1, true));
    return Promise.all(promises).then(() => console.log("created invitation complete"));
});
/* ----- SELF INSPECTION ----- */
exports.createdSelfInspection = functions.firestore
    .document("team/{teamId}/self-inspection/{id}")
    .onCreate((snapshot, context) => {
    let selfInspection = snapshot.data();
    /* total self inspections achievement */
    const achievement = updateCompletedAchievement(context.params.teamId, "startedSelfAssesments", 1, true);
    const event = logAsEvent(EventType.selfInspection, EventAction.created, snapshot.id, selfInspection.userId, "Started a Self Inspection", context.params.teamId);
    return Promise.all([achievement, event]).then(() => console.log("created self inspection complete"));
});
exports.modifySelfInspectionInspection = functions.firestore
    .document("team/{teamId}/self-inspection/{id}/inspections/{inspecitonId}")
    .onUpdate((change, context) => {
    let oldI = change.before.data();
    let newI = change.after.data();
    if (newI.completedAt !== null && oldI.completedAt == null) {
        // has been completed
        const achievement = updateCompletedAchievement(context.params.teamId, "completedSelfAssesments", 1, true);
        const event = logAsEvent(EventType.selfInspection, EventAction.completed, change.after.id, newI.completedBy, "Finished a Self Inspection", context.params.teamId);
        return Promise.all([event, achievement]).then(() => console.log("updated self inspection complete"));
    }
    else
        return null;
});
/* ----- INJURY REPORT ----- */
exports.createdInjuryReport = functions.firestore
    .document("team/{teamId}/incident-report/{id}")
    .onCreate((snapshot, context) => {
    let injuryReport = snapshot.data();
    /* total self inspections achievement */
    const achievement = updateCompletedAchievement(context.params.teamId, "injuryReports", 1, true);
    const event = logAsEvent(EventType.incidentReport, EventAction.created, snapshot.id, injuryReport.submittedBy, "Created a new " + injuryReport.type, context.params.teamId);
    return Promise.all([event, achievement]).then(() => console.log("created injury report complete"));
});
/* ----- LIKED TRAINING ----- */
exports.likedTraining = functions.firestore
    .document("team/{teamId}/my-training-content/{id}")
    .onCreate((snapshot, context) => {
    const achievement = updateCompletedAchievement(context.params.teamId, "likedTrainingContent", 1, true);
    return Promise.all([achievement]).then(() => console.log("created injury report complete"));
});
/* ----- SURVEY ----- */
exports.createdSurvey = functions.firestore
    .document("team/{teamId}/survey/{id}")
    .onCreate((snapshot, context) => {
    let survey = snapshot.data();
    const log = logAsEvent(EventType.survey, EventAction.created, snapshot.id, survey.userId, survey.title, context.params.teamId);
    const achievement = updateCompletedAchievement(context.params.teamId, "startedTrainings", 1, true);
    return Promise.all([log, achievement]).then(() => console.log("created survey complete"));
});
exports.modifiedSurvey = functions.firestore
    .document("team/{teamId}/survey/{surveyId}")
    .onUpdate((change, context) => {
    let newSurvey = change.after.data();
    return logAsEvent(EventType.survey, EventAction.updated, change.after.id, newSurvey.userId, newSurvey.title, context.params.teamId).then(() => console.log("updated survey complete"));
});
exports.deletedSurvey = functions.firestore
    .document("team/{teamId}/survey/{logId}")
    .onDelete((snapshot, context) => {
    let deletedSurvey = snapshot.data();
    return logAsEvent(EventType.log, EventAction.deleted, snapshot.id, deletedSurvey.userId, deletedSurvey.title, context.params.teamId).then(() => console.log("deleted survey complete"));
});
/* ----- SURVEY RESPONSE ----- */
exports.createdSurveyResponse = functions.firestore
    .document("team/{teamId}/survey-response/{id}")
    .onCreate((snapshot, context) => {
    let surveyResponse = snapshot.data();
    const trainingSurveyResponse = updateCompletedAchievement(context.params.teamId, "trainingSurveyResponseCount", 1, true);
    const trainingLog = logAsEvent(EventType.surveyResponse, EventAction.repsond, surveyResponse.surveyId, surveyResponse.userId, surveyResponse.shortAnswer.toString() ||
        "" + " " + surveyResponse.longAnser ||
        "", context.params.teamId);
    return Promise.all([trainingLog, trainingSurveyResponse]).then(() => console.log("created survey response complete"));
});
/* ----- CUSTOM ARTICLE ----- */
exports.createdCustomTrainingArticle = functions.firestore
    .document("team/{teamId}/article/{id}")
    .onCreate((snapshot, context) => {
    let article = snapshot.data();
    const trainingSurveyResponse = updateCompletedAchievement(context.params.teamId, "customTrainingArticleCount", 1, true);
    return Promise.all([trainingSurveyResponse]).then(() => console.log("created survey response complete"));
});
/*  ---------- Achievements ----------  */
function updateCompletedAchievement(teamId, mapKey, value, sum) {
    return admin
        .firestore()
        .collection("completed-achievement")
        .where("teamId", "==", teamId)
        .get()
        .then(querySnapshot => {
        querySnapshot.forEach(doc => {
            // should only be one, can't think of a better way
            const docData = doc.data();
            let obj = {};
            obj[mapKey] = sum ? docData[mapKey] + value : value;
            return admin
                .firestore()
                .doc("completed-achievement/" + doc.id)
                .update(obj);
        });
    })
        .catch(error => {
        return console.log("Error getting documents: ", error);
    });
}
/*  ---------- EVENTS ----------  */
function logAsEvent(type, action, documentId, userId, description, teamId) {
    let createdAt = new Date();
    let event = {
        type,
        action,
        documentId,
        userId,
        description,
        createdAt
    };
    return admin
        .firestore()
        .collection(`team/${teamId}/event`)
        .add(event)
        .then(newEvent => {
        console.log(`event created: ${newEvent.id}`);
    });
}
class Event {
}
exports.Event = Event;
var EventType;
(function (EventType) {
    EventType["log"] = "Log";
    EventType["timeclock"] = "Timeclock";
    EventType["incidentReport"] = "Incident Report";
    EventType["survey"] = "Survey";
    EventType["surveyResponse"] = "Survey";
    EventType["selfInspection"] = "Self Inspection";
    EventType["training"] = "Training";
    EventType["member"] = "New Member";
    EventType["customContent"] = "Custom training article";
})(EventType || (EventType = {}));
var EventAction;
(function (EventAction) {
    EventAction["created"] = "created";
    EventAction["updated"] = "updated";
    EventAction["deleted"] = "deleted";
    EventAction["repsond"] = "responded to";
    EventAction["completed"] = "completed";
})(EventAction || (EventAction = {}));
//# sourceMappingURL=index.js.map