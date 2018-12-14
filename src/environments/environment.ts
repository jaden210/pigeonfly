// This file can be replaced during build by using the `fileReplacements` array.
// `ng build ---prod` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
  production: false,
  firebaseConfig: {
    apiKey: "AIzaSyB9gfea4YtAckHj-yljfZVzv-R33A4wEVw",
    authDomain: "compliancechimp-dev.firebaseapp.com",
    databaseURL: "https://compliancechimp-dev.firebaseio.com",
    projectId: "compliancechimp-dev",
    storageBucket: "compliancechimp-dev.appspot.com",
    messagingSenderId: "370152164668"
  },
  stripe: {
    publishable: "pk_test_xQTLf7GJIEhTX1tz1AVeJaea",
    secret: "sk_test_eBRntjsgqdxvMjQptP3TnZo2"
  }
};

/*
 * In development mode, for easier debugging, you can ignore zone related error
 * stack frames such as `zone.run`/`zoneDelegate.invokeTask` by importing the
 * below file. Don't forget to comment it out in production mode
 * because it will have a performance impact when errors are thrown
 */
// import 'zone.js/dist/zone-error';  // Included with Angular CLI.
