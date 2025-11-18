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
    breakandLuxTest: a.string(),
    serviceplankm: a.float(),
    breakandLuxExpirey: a.date(),
    liscenseDiscExpirey: a.date(),
    inspection: a.hasMany('Inspection', 'fleetid'),
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
    fleet: a.belongsTo('Fleet', 'fleetid'),
  }).secondaryIndexes((index) => [
    index('fleetid')
      .sortKeys(['inspectionDate'])
      .queryField('inspectionsByFleetAndDate'),
    index('fleetid')
      .sortKeys(['inspectionNo'])
      .queryField('inspectionsByFleetAndNumber')
  ]).authorization((allow) => [allow.publicApiKey()]),

  TaskTable: a
    .model({
      vehicleReg: a.string().required(),
      taskType: a.enum(["service", "rotation", "licensedisc", "breaknlux"]),
      clickupTaskId: a.string(), // Store ClickUp task ID for reference
    })
    .secondaryIndexes((index) => [
      index("vehicleReg").sortKeys(["taskType"]), // Check if task exists for vehicle+type
      index("clickupTaskId")
    ])
    .authorization((allow) => [allow.publicApiKey()]),

  EmployeeTaskTable: a
    .model({
      employeeId: a.string().required(),
      employeeName: a.string().required(),
      taskType: a.string().required(),
      documentType: a.string().required(),
      documentIdentifier: a.string().required(),
      clickupTaskId: a.string(),
    })
    .secondaryIndexes((index) => [
      index("employeeId").sortKeys(["employeeName"]).queryField("listEmployeeTaskTableByEmployeeIdAndEmployeeName"),
      index("employeeId"),
      index("taskType"),
      index("documentIdentifier"),
      index("clickupTaskId")
    ])
    .authorization((allow) => [allow.publicApiKey()]),

  Employee: a
    .model({
      employeeId: a.string().required(),
      employeeNumber: a.string(),
      firstName: a.string().required(),
      surname: a.string().required(),
      employeeIdAttachment: a.string(),
      knownAs: a.string(),
      passportNumber: a.string(),
      passportExpiry: a.date(),
      passportAttachment: a.string(),
      driversLicenseCode: a.string(),
      driversLicenseExpiry: a.date(),
      driversLicenseAttachment: a.string(),
      authorizedDriver: a.boolean(),
      pdpExpiry: a.date(),
      pdpAttachment: a.string(),
      // Core documents
      cvAttachment: a.string(),
      ppeListAttachment: a.string(),
      ppeExpiry: a.date(),
      // Medical certificates as relations
      medicalCertificates: a.hasMany('EmployeeMedicalCertificate', 'employeeId'),
      // Training certificates as relations
      trainingCertificates: a.hasMany('EmployeeTrainingCertificate', 'employeeId'),
      // Additional certificates
      additionalCertificates: a.hasMany('EmployeeAdditionalCertificate', 'employeeId'),
    })
    .secondaryIndexes((index) => [
      index("employeeId"),
      index("employeeNumber"),
      index("driversLicenseExpiry").queryField("employeesByLicenseExpiry"),
      index("passportExpiry").queryField("employeesByPassportExpiry")
    ])
    .authorization((allow) => [allow.publicApiKey()]),

  EmployeeMedicalCertificate: a
    .model({
      employeeId: a.string().required(),
      certificateType: a.enum([
        "CLINIC_PLUS",
        "CLINIC_PLUS_INDUCTION",
        "HEARTLY_HEALTH",
        "KLIPSPRUIT_MEDICAL",
        "LUYUYO_MEDICAL",
        "KRIEL_MEDICAL",
        "PRO_HEALTH_MEDICAL",
        "WILGE_VXR"
      ]),
      expiryDate: a.date().required(),
      attachment: a.string(),
      employee: a.belongsTo('Employee', 'employeeId'),
    })
    .secondaryIndexes((index) => [
      index("employeeId").sortKeys(["expiryDate"]).queryField("medicalCertsByEmployee"),
      index("expiryDate").queryField("medicalCertsByExpiry")
    ])
    .authorization((allow) => [allow.publicApiKey()]),

  EmployeeTrainingCertificate: a
    .model({
      employeeId: a.string().required(),
      certificateType: a.enum([
        "FIREFIGHTING",
        "FIRST_AID_LEVEL_1",
        "FIRST_AID_LEVEL_2",
        "WORKING_AT_HEIGHTS",
        "WORKING_WITH_HAND_TOOLS",
        "WORKING_WITH_POWER_TOOLS",
        "SATS_CONVEYOR",
        "SATS_COP_SOP",
        "SATS_ILOT",
        "OHS_ACT",
        "MHSA",
        "HIRA_TRAINING",
        "APPOINTMENT_2_9_2",
        "OEM_CERT",
        "LEGAL_LIABILITY"
      ]),
      expiryDate: a.date().required(),
      attachment: a.string(),
      employee: a.belongsTo('Employee', 'employeeId'),
    })
    .secondaryIndexes((index) => [
      index("employeeId").sortKeys(["expiryDate"]).queryField("trainingCertsByEmployee"),
      index("expiryDate").queryField("trainingCertsByExpiry"),
      index("certificateType").queryField("trainingCertsByType")
    ])
    .authorization((allow) => [allow.publicApiKey()]),

  EmployeeAdditionalCertificate: a
    .model({
      employeeId: a.string().required(),
      certificateName: a.string().required(),
      expiryDate: a.date().required(),
      attachment: a.string(),
      employee: a.belongsTo('Employee', 'employeeId'),
    })
    .secondaryIndexes((index) => [
      index("employeeId").sortKeys(["expiryDate"]).queryField("additionalCertsByEmployee"),
      index("expiryDate").queryField("additionalCertsByExpiry")
    ])
    .authorization((allow) => [allow.publicApiKey()]),

  History: a.model({
    entityType: a.enum(["COMPONENT", "FLEET", "INSPECTION", "EMPLOYEE"]),
    entityId: a.string().required(),
    action: a.string().required(), // "STOCK_UPDATE", "SERVICE", "DOCUMENT_UPDATE"
    timestamp: a.datetime().required(),
    details: a.string().required(), // Specific description of what changed
  }).secondaryIndexes((index) => [
      index("entityId").sortKeys(["timestamp"]).queryField("getHistoryByEntityId"),
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


