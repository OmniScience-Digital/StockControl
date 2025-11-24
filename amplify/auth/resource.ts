import { defineAuth, secret } from "@aws-amplify/backend";

/**
 * Define and configure your auth resource
 * @see https://docs.amplify.aws/gen2/build-a-backend/auth
 */
export const auth = defineAuth({
  loginWith: {
    email: true,
    // externalProviders: {
    //   google: {
    //     clientId: secret("GOOGLE_CLIENT_ID"),
    //     clientSecret: secret("GOOGLE_SECRET"),
    //     scopes: ["profile", "email"],
    //     attributeMapping: {
    //       email: "email",
    //     },
    //   },
    //   callbackUrls: [
    //     "http://localhost:3000/landing",
    //     "https://main.d1nmjnbjfdtu8r.amplifyapp.com/landing",
    //     "https://test.d1nmjnbjfdtu8r.amplifyapp.com/landing",
    //   ],
    //   logoutUrls: [
    //     "http://localhost:3000",
    //     "https://main.d1nmjnbjfdtu8r.amplifyapp.com/",
    //     "https://test.d1nmjnbjfdtu8r.amplifyapp.com/",
    //   ],
    // },
  },
});
