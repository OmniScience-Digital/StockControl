import { type ClientSchema, a, defineData } from "@aws-amplify/backend";

const schema = a.schema({
  Landing: a
    .model({
      key:a.string(),
      items: a.string(),
    })
    .authorization((allow) => [allow.publicApiKey()]),
  Component: a
    .model({
      name: a.string(),
      subComponents: a.hasMany('SubComponent', 'componentId'),
    }).secondaryIndexes((index) => [index("name")])
    .authorization((allow) => [allow.publicApiKey()]),

  SubComponent: a
    .model({
      key: a.string(),
      value: a.float(),
      componentId: a.id().required(),
      component: a.belongsTo("Component", "componentId"),
    })
    .secondaryIndexes((index) => [
      index("componentId")
        .sortKeys(["key"])
        .name("byComponentAndKey")
        .queryField("listSubComponentByComponentIdAndKey"),
    ])
    .authorization((allow) => [allow.publicApiKey()]),

});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: "apiKey",
    apiKeyAuthorizationMode: {
      expiresInDays: 365,
    },
  },
});