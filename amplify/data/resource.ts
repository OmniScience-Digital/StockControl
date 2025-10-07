import { type ClientSchema, a, defineData } from "@aws-amplify/backend";

const schema = a.schema({
  Landing: a
    .model({
      key: a.string(),
      items: a.string(),
    })
    .authorization((allow) => [allow.publicApiKey()]),
  Category: a.model({
    categoryName: a.string().required(),
    subcategories: a.hasMany('SubCategory', 'categoryId'),
  }).authorization((allow) => [allow.publicApiKey()])
    .secondaryIndexes((index) => [index("categoryName")]),

  SubCategory: a.model({
    subcategoryName: a.string().required(),
    categoryId: a.string().required(),
    category: a.belongsTo('Category', 'categoryId'),
    components: a.hasMany('Component', 'subcategoryId'),
  }).secondaryIndexes((index) => [
    index("categoryId")
      .sortKeys(["subcategoryName"])
      .queryField("listSubCategoriesByCategoryIdAndName")
  ]).authorization((allow) => [allow.publicApiKey()]),

  Component: a.model({
    componentId: a.string().required(),
    componentName: a.string(),
    description: a.string(),
    primarySupplierId: a.string(),
    primarySupplier: a.string(),
    primarySupplierItemCode: a.string(),
    secondarySupplierId: a.string(),
    secondarySupplier: a.string(),
    secondarySupplierItemCode: a.string(),
    qtyExStock: a.integer(),
    currentStock: a.integer(),
    notes: a.string(),
    history: a.string(),
    subcategoryId: a.string().required(),
    subcategory: a.belongsTo('SubCategory', 'subcategoryId'),
  }).secondaryIndexes((index) => [
    index("subcategoryId")
      .sortKeys(["componentId"])
      .queryField("listComponentsBySubCategoryId"),
    index("primarySupplierId")
      .sortKeys(["componentId"])
      .queryField("listComponentsByPrimarySupplier"),
  ]).authorization((allow) => [allow.publicApiKey()]),

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