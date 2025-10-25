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
    minimumStock: a.integer(),
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

  Fleet: a.model({
    vehicleVin: a.string(),
    vehicleReg: a.string(),
    vehicleMake: a.string(),
    vehicleModel: a.string(),
    transmitionType: a.string(),
    ownershipStatus: a.string(),
    fleetIndex: a.string(),
    fleetNumber: a.string(),
    lastServicedate: a.date(),
    lastServicekm: a.float(),
    lastRotationdate: a.date(),
    lastRotationkm: a.float(),
    servicePlanStatus: a.boolean(),
    servicePlan: a.string(),
    currentDriver: a.string(),
    currentkm: a.float(),
    codeRequirement: a.string(),
    pdpRequirement: a.boolean(),
    breakandLuxTest: a.string().array(),
    serviceplankm:a.float(),
    breakandLuxExpirey: a.date(),
    history: a.string(),
    inspection:a.hasMany('Inspection','fleetid'),
  }).authorization((allow) => [allow.publicApiKey()]),


Inspection: a.model({
    fleetid: a.string().required(),
    inspectionNo: a.integer(), 
    vehicleVin: a.string(), 
    inspectionDate: a.date(),
    inspectionTime: a.time(),
    odometerStart: a.float(),
    vehicleReg: a.string(),
    inspectorOrDriver: a.string(),
    oilAndCoolant: a.boolean(),
    fuelLevel: a.boolean(),
    seatbeltDoorsMirrors: a.boolean(),
    handbrake: a.boolean(),
    tyreCondition: a.boolean(),
    spareTyre: a.boolean(),
    numberPlate: a.boolean(),
    licenseDisc: a.boolean(),
    leaks: a.boolean(),
    lights: a.boolean(),
    defrosterAircon: a.boolean(),
    emergencyKit: a.boolean(),
    clean: a.boolean(),
    warnings: a.boolean(),
    windscreenWipers: a.boolean(),
    serviceBook: a.boolean(),
    siteKit: a.boolean(),
    photo: a.string().array(), 
    history: a.string(),
    fleet: a.belongsTo('Fleet','fleetid'),
}).secondaryIndexes((index) => [
    index('fleetid')
        .sortKeys(['inspectionDate'])
        .queryField('inspectionsByFleetAndDate')
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


