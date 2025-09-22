import { type ClientSchema, a, defineData } from "@aws-amplify/backend";

const schema = a.schema({
  Component: a
    .model({
      name: a.string(),
      subComponents: a.hasMany("SubComponent", "componentId"),
    })
    .authorization((allow) => [allow.publicApiKey()]),
    
  SubComponent: a
    .model({
      key: a.string(),
      value: a.float(),
      isWithdrawal: a.boolean(),
      component: a.belongsTo("Component", "componentId"),
    })
    .authorization((allow) => [allow.publicApiKey()]),
});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: "apiKey",
    apiKeyAuthorizationMode: {
      expiresInDays: 30,
    },
  },
});