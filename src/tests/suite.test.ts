import fs from 'fs';
import Gen from '../parser/gen';
import Writer from '../parser/io/writer';
import * as path from 'path';
import * as os from 'os';
import { execSync, spawnSync } from 'child_process';
import * as assert from 'node:assert';

const base =
  '/Users/fernando/Development/Apollo/connectors/projects/OasToConnector/apollo-connector-gen/src/test/resources/';

test('test minimal petstore', async () => {
  const paths = [
    'get:/pet/{petId}>res:r>ref:#/c/s/Pet>obj:#/c/s/Pet>prop:scalar:id',
    'get:/pet/{petId}>res:r>ref:#/c/s/Pet>obj:#/c/s/Pet>prop:scalar:name',
    'get:/pet/{petId}>res:r>ref:#/c/s/Pet>obj:#/c/s/Pet>prop:ref:#category>obj:#/c/s/Category>prop:scalar:name',
  ];

  await run(`petstore.yaml`, paths, 8, 2);
});

test('test minimal petstore 02', async () => {
  const paths = [
    'get:/pet/{petId}>res:r>ref:#/c/s/Pet>obj:#/c/s/Pet>prop:array:#tags>prop:ref:#TagsItem>obj:#/c/s/Tag>prop:scalar:id',
    'get:/pet/{petId}>res:r>ref:#/c/s/Pet>obj:#/c/s/Pet>prop:array:#tags>prop:ref:#TagsItem>obj:#/c/s/Tag>prop:scalar:name',
    'get:/pet/{petId}>res:r>ref:#/c/s/Pet>obj:#/c/s/Pet>prop:ref:#category>obj:#/c/s/Category>prop:scalar:id',
    'get:/pet/{petId}>res:r>ref:#/c/s/Pet>obj:#/c/s/Pet>prop:ref:#category>obj:#/c/s/Category>prop:scalar:name',
    'get:/pet/{petId}>res:r>ref:#/c/s/Pet>obj:#/c/s/Pet>prop:scalar:id',
    'get:/pet/{petId}>res:r>ref:#/c/s/Pet>obj:#/c/s/Pet>prop:scalar:name',
    'get:/pet/{petId}>res:r>ref:#/c/s/Pet>obj:#/c/s/Pet>prop:array:#photoUrls>prop:scalar:PhotoUrlsItem',
    'get:/pet/{petId}>res:r>ref:#/c/s/Pet>obj:#/c/s/Pet>prop:scalar:status',
  ];

  await run(`petstore.yaml`, paths, 8, 3);
});

test('test minimal petstore 03 array', async () => {
  const paths = [
    'get:/pet/{petId}>res:r>ref:#/c/s/Pet>obj:#/c/s/Pet>prop:array:#photoUrls',
  ];

  await run(`petstore.yaml`, paths, 8, 1);
});

test('test full petstore', async () => {
  expect(fs.existsSync(`${base}/petstore.yaml`)).toBeTruthy();

  let file = fs.readFileSync(`${base}/petstore.yaml`);
  expect(file).toBeDefined();

  const paths = [
    'get:/pet/{petId}>res:r>ref:#/c/s/Pet>obj:#/c/s/Pet>prop:ref:#category>obj:#/c/s/Category>prop:scalar:id',
    'get:/pet/{petId}>res:r>ref:#/c/s/Pet>obj:#/c/s/Pet>prop:ref:#category>obj:#/c/s/Category>prop:scalar:name',
    'get:/pet/{petId}>res:r>ref:#/c/s/Pet>obj:#/c/s/Pet>prop:scalar:id',
    'get:/pet/{petId}>res:r>ref:#/c/s/Pet>obj:#/c/s/Pet>prop:scalar:name',
    'get:/pet/{petId}>res:r>ref:#/c/s/Pet>obj:#/c/s/Pet>prop:array:#photoUrls',
    'get:/pet/{petId}>res:r>ref:#/c/s/Pet>obj:#/c/s/Pet>prop:scalar:status',
    'get:/pet/{petId}>res:r>ref:#/c/s/Pet>obj:#/c/s/Pet>prop:array:#tags>prop:ref:#TagsItem>obj:#/c/s/Tag>prop:scalar:id',
    'get:/pet/{petId}>res:r>ref:#/c/s/Pet>obj:#/c/s/Pet>prop:array:#tags>prop:ref:#TagsItem>obj:#/c/s/Tag>prop:scalar:name',
    'get:/pet/findByStatus>res:r>array:#/c/s/Pet>ref:#/c/s/Pet>obj:#/c/s/Pet>prop:ref:#category>obj:#/c/s/Category>prop:scalar:id',
    'get:/pet/findByStatus>res:r>array:#/c/s/Pet>ref:#/c/s/Pet>obj:#/c/s/Pet>prop:ref:#category>obj:#/c/s/Category>prop:scalar:name',
    'get:/pet/findByStatus>res:r>array:#/c/s/Pet>ref:#/c/s/Pet>obj:#/c/s/Pet>prop:scalar:id',
    'get:/pet/findByStatus>res:r>array:#/c/s/Pet>ref:#/c/s/Pet>obj:#/c/s/Pet>prop:scalar:name',
    'get:/pet/findByStatus>res:r>array:#/c/s/Pet>ref:#/c/s/Pet>obj:#/c/s/Pet>prop:array:#photoUrls',
    'get:/pet/findByStatus>res:r>array:#/c/s/Pet>ref:#/c/s/Pet>obj:#/c/s/Pet>prop:scalar:status',
    'get:/pet/findByStatus>res:r>array:#/c/s/Pet>ref:#/c/s/Pet>obj:#/c/s/Pet>prop:array:#tags>prop:ref:#TagsItem>obj:#/c/s/Tag>prop:scalar:id',
    'get:/pet/findByStatus>res:r>array:#/c/s/Pet>ref:#/c/s/Pet>obj:#/c/s/Pet>prop:array:#tags>prop:ref:#TagsItem>obj:#/c/s/Tag>prop:scalar:name',
    'get:/pet/findByTags>res:r>array:#/c/s/Pet>ref:#/c/s/Pet>obj:#/c/s/Pet>prop:ref:#category>obj:#/c/s/Category>prop:scalar:id',
    'get:/pet/findByTags>res:r>array:#/c/s/Pet>ref:#/c/s/Pet>obj:#/c/s/Pet>prop:ref:#category>obj:#/c/s/Category>prop:scalar:name',
    'get:/pet/findByTags>res:r>array:#/c/s/Pet>ref:#/c/s/Pet>obj:#/c/s/Pet>prop:scalar:id',
    'get:/pet/findByTags>res:r>array:#/c/s/Pet>ref:#/c/s/Pet>obj:#/c/s/Pet>prop:scalar:name',
    'get:/pet/findByTags>res:r>array:#/c/s/Pet>ref:#/c/s/Pet>obj:#/c/s/Pet>prop:array:#photoUrls',
    'get:/pet/findByTags>res:r>array:#/c/s/Pet>ref:#/c/s/Pet>obj:#/c/s/Pet>prop:scalar:status',
    'get:/pet/findByTags>res:r>array:#/c/s/Pet>ref:#/c/s/Pet>obj:#/c/s/Pet>prop:array:#tags>prop:ref:#TagsItem>obj:#/c/s/Tag>prop:scalar:id',
    'get:/pet/findByTags>res:r>array:#/c/s/Pet>ref:#/c/s/Pet>obj:#/c/s/Pet>prop:array:#tags>prop:ref:#TagsItem>obj:#/c/s/Tag>prop:scalar:name',
    'get:/store/order/{orderId}>res:r>ref:#/c/s/Order>obj:#/c/s/Order>prop:scalar:complete',
    'get:/store/order/{orderId}>res:r>ref:#/c/s/Order>obj:#/c/s/Order>prop:scalar:id',
    'get:/store/order/{orderId}>res:r>ref:#/c/s/Order>obj:#/c/s/Order>prop:scalar:petId',
    'get:/store/order/{orderId}>res:r>ref:#/c/s/Order>obj:#/c/s/Order>prop:scalar:quantity',
    'get:/store/order/{orderId}>res:r>ref:#/c/s/Order>obj:#/c/s/Order>prop:scalar:shipDate',
    'get:/store/order/{orderId}>res:r>ref:#/c/s/Order>obj:#/c/s/Order>prop:scalar:status',
    'get:/user/{username}>res:r>ref:#/c/s/User>obj:#/c/s/User>prop:scalar:email',
    'get:/user/{username}>res:r>ref:#/c/s/User>obj:#/c/s/User>prop:scalar:firstName',
    'get:/user/{username}>res:r>ref:#/c/s/User>obj:#/c/s/User>prop:scalar:id',
    'get:/user/{username}>res:r>ref:#/c/s/User>obj:#/c/s/User>prop:scalar:lastName',
    'get:/user/{username}>res:r>ref:#/c/s/User>obj:#/c/s/User>prop:scalar:password',
    'get:/user/{username}>res:r>ref:#/c/s/User>obj:#/c/s/User>prop:scalar:phone',
    'get:/user/{username}>res:r>ref:#/c/s/User>obj:#/c/s/User>prop:scalar:username',
    'get:/user/{username}>res:r>ref:#/c/s/User>obj:#/c/s/User>prop:scalar:userStatus',
  ];

  await run(`petstore.yaml`, paths, 8, 5);
});

test('test_003_testConsumerJourney', async () => {
  const paths = [
    'get:/consumer/{id}>res:r>ref:#/c/s/Consumer>obj:#/c/s/Consumer>prop:scalar:firstName',
    'get:/consumer/{id}>res:r>ref:#/c/s/Consumer>obj:#/c/s/Consumer>prop:scalar:lastName',
  ];

  await run('js-mva-consumer-info_v1.yaml', paths, 1, 2);
});

test('test_004_testConsumerJourneyScalarsOnly', async () => {
  const paths = [
    'get:/consumer/{id}>res:r>ref:#/c/s/Consumer>obj:#/c/s/Consumer>prop:scalar:birthDate',
    'get:/consumer/{id}>res:r>ref:#/c/s/Consumer>obj:#/c/s/Consumer>prop:scalar:firstName',
    'get:/consumer/{id}>res:r>ref:#/c/s/Consumer>obj:#/c/s/Consumer>prop:scalar:gender',
    'get:/consumer/{id}>res:r>ref:#/c/s/Consumer>obj:#/c/s/Consumer>prop:scalar:lastName',
    'get:/consumer/{id}>res:r>ref:#/c/s/Consumer>obj:#/c/s/Consumer>prop:scalar:me',
    'get:/consumer/{id}>res:r>ref:#/c/s/Consumer>obj:#/c/s/Consumer>prop:scalar:taxIdentifier',
    'get:/consumer/{id}>res:r>ref:#/c/s/Consumer>obj:#/c/s/Consumer>prop:scalar:title',
  ];

  await run('js-mva-consumer-info_v1.yaml', paths, 1, 2);
});

test('test_004_testAccountSegment', async () => {
  const paths = [
    'get:/consumer/{id}>res:r>ref:#/c/s/Consumer>obj:#/c/s/Consumer>prop:array:#accounts>prop:ref:#AccountsItem>obj:#/c/s/Account>prop:ref:#segment>obj:#/c/s/SegmentCharacteristic>prop:scalar:category',
    'get:/consumer/{id}>res:r>ref:#/c/s/Consumer>obj:#/c/s/Consumer>prop:scalar:firstName',
    'get:/consumer/{id}>res:r>ref:#/c/s/Consumer>obj:#/c/s/Consumer>prop:scalar:gender',
  ];

  await run('js-mva-consumer-info_v1.yaml', paths, 1, 4);
});

test('test_005_testHomepageProductSelector', async () => {
  const paths = [
    'get:/productSelectorItems>res:r>ref:#/c/s/productSelectorItems>array:ProductSelectorItemsItem>obj:ProductSelectorItemsItem>prop:scalar:activationDate',
  ];

  await run('js-mva-homepage-product-selector_v3.yaml', paths, 3, 1);
});

test('test_005_testHomepageProductSelector 02', async () => {
  const paths = [
    'get:/productSelectorItems>res:r>ref:#/c/s/productSelectorItems>array:ProductSelectorItemsItem>obj:ProductSelectorItemsItem>prop:scalar:activationDate',
    'get:/productSelectorItems>res:r>ref:#/c/s/productSelectorItems>array:ProductSelectorItemsItem>obj:ProductSelectorItemsItem>prop:scalar:contractEndDate',
    'get:/productSelectorItems>res:r>ref:#/c/s/productSelectorItems>array:ProductSelectorItemsItem>obj:ProductSelectorItemsItem>prop:scalar:description',
    'get:/productSelectorItems>res:r>ref:#/c/s/productSelectorItems>array:ProductSelectorItemsItem>obj:ProductSelectorItemsItem>prop:scalar:deviceCounter',
    'get:/productSelectorItems>res:r>ref:#/c/s/productSelectorItems>array:ProductSelectorItemsItem>obj:ProductSelectorItemsItem>prop:scalar:hasUsage',
    'get:/productSelectorItems>res:r>ref:#/c/s/productSelectorItems>array:ProductSelectorItemsItem>obj:ProductSelectorItemsItem>prop:scalar:id',
    'get:/productSelectorItems>res:r>ref:#/c/s/productSelectorItems>array:ProductSelectorItemsItem>obj:ProductSelectorItemsItem>prop:scalar:isBundle',
    'get:/productSelectorItems>res:r>ref:#/c/s/productSelectorItems>array:ProductSelectorItemsItem>obj:ProductSelectorItemsItem>prop:scalar:isBundled',
    'get:/productSelectorItems>res:r>ref:#/c/s/productSelectorItems>array:ProductSelectorItemsItem>obj:ProductSelectorItemsItem>prop:scalar:isOneNumber',
    'get:/productSelectorItems>res:r>ref:#/c/s/productSelectorItems>array:ProductSelectorItemsItem>obj:ProductSelectorItemsItem>prop:scalar:name',
    'get:/productSelectorItems>res:r>ref:#/c/s/productSelectorItems>array:ProductSelectorItemsItem>obj:ProductSelectorItemsItem>prop:scalar:phoneNumber',
    'get:/productSelectorItems>res:r>ref:#/c/s/productSelectorItems>array:ProductSelectorItemsItem>obj:ProductSelectorItemsItem>prop:scalar:price',
    'get:/productSelectorItems>res:r>ref:#/c/s/productSelectorItems>array:ProductSelectorItemsItem>obj:ProductSelectorItemsItem>prop:scalar:renewalDate',
    'get:/productSelectorItems>res:r>ref:#/c/s/productSelectorItems>array:ProductSelectorItemsItem>obj:ProductSelectorItemsItem>prop:scalar:serviceId',
    'get:/productSelectorItems>res:r>ref:#/c/s/productSelectorItems>array:ProductSelectorItemsItem>obj:ProductSelectorItemsItem>prop:scalar:speed',
    'get:/productSelectorItems>res:r>ref:#/c/s/productSelectorItems>array:ProductSelectorItemsItem>obj:ProductSelectorItemsItem>prop:scalar:status',
    'get:/productSelectorItems>res:r>ref:#/c/s/productSelectorItems>array:ProductSelectorItemsItem>obj:ProductSelectorItemsItem>prop:scalar:type',
  ];

  await run('js-mva-homepage-product-selector_v3.yaml', paths, 3, 1);
});

test('test_006_testHomepageProductSelectorInlineArray', async () => {
  const paths = [
    'get:/productSelectorItemDetails>res:r>ref:#/c/s/productSelectorItemDetails>obj:#/c/s/productSelectorItemDetails>prop:scalar:serviceId',
    'get:/productSelectorItemDetails>res:r>ref:#/c/s/productSelectorItemDetails>obj:#/c/s/productSelectorItemDetails>prop:array:#usageConsumption>prop:obj:UsageConsumptionItem>obj:UsageConsumptionItem>prop:scalar:productId',
    'get:/productSelectorItemDetails>res:r>ref:#/c/s/productSelectorItemDetails>obj:#/c/s/productSelectorItemDetails>prop:array:#usageConsumption>prop:obj:UsageConsumptionItem>obj:UsageConsumptionItem>prop:ref:#usageSummary>array:UsageSummaryItem>obj:UsageSummaryItem>prop:scalar:isUnlimited',
    'get:/productSelectorItemDetails>res:r>ref:#/c/s/productSelectorItemDetails>obj:#/c/s/productSelectorItemDetails>prop:array:#usageConsumption>prop:obj:UsageConsumptionItem>obj:UsageConsumptionItem>prop:ref:#usageSummary>array:UsageSummaryItem>obj:UsageSummaryItem>prop:scalar:remainingValue',
    'get:/productSelectorItemDetails>res:r>ref:#/c/s/productSelectorItemDetails>obj:#/c/s/productSelectorItemDetails>prop:array:#usageConsumption>prop:obj:UsageConsumptionItem>obj:UsageConsumptionItem>prop:ref:#usageSummary>array:UsageSummaryItem>obj:UsageSummaryItem>prop:scalar:totalValue',
    'get:/productSelectorItemDetails>res:r>ref:#/c/s/productSelectorItemDetails>obj:#/c/s/productSelectorItemDetails>prop:array:#usageConsumption>prop:obj:UsageConsumptionItem>obj:UsageConsumptionItem>prop:ref:#usageSummary>array:UsageSummaryItem>obj:UsageSummaryItem>prop:scalar:type',
    'get:/productSelectorItemDetails>res:r>ref:#/c/s/productSelectorItemDetails>obj:#/c/s/productSelectorItemDetails>prop:array:#usageConsumption>prop:obj:UsageConsumptionItem>obj:UsageConsumptionItem>prop:ref:#usageSummary>array:UsageSummaryItem>obj:UsageSummaryItem>prop:scalar:unit',
    'get:/productSelectorItemDetails>res:r>ref:#/c/s/productSelectorItemDetails>obj:#/c/s/productSelectorItemDetails>prop:array:#usageConsumption>prop:obj:UsageConsumptionItem>obj:UsageConsumptionItem>prop:ref:#usageSummary>array:UsageSummaryItem>obj:UsageSummaryItem>prop:scalar:usageType',
    'get:/productSelectorItemDetails>res:r>ref:#/c/s/productSelectorItemDetails>obj:#/c/s/productSelectorItemDetails>prop:array:#usageConsumption>prop:obj:UsageConsumptionItem>obj:UsageConsumptionItem>prop:ref:#usageSummary>array:UsageSummaryItem>obj:UsageSummaryItem>prop:scalar:usedValue',
    'get:/productSelectorItemDetails>res:r>ref:#/c/s/productSelectorItemDetails>obj:#/c/s/productSelectorItemDetails>prop:array:#usageConsumption>prop:obj:UsageConsumptionItem>obj:UsageConsumptionItem>prop:ref:#usageSummary>array:UsageSummaryItem>obj:UsageSummaryItem>prop:scalar:validFor',
  ];
  await run('js-mva-homepage-product-selector_v3.yaml', paths, 3, 3);
});

test('test_008_testHomepageProductSelectorAnonymousObject', async () => {
  const paths = [
    'get:/productSelectorItems>res:r>ref:#/c/s/productSelectorItems>array:ProductSelectorItemsItem>obj:ProductSelectorItemsItem>prop:array:#productRelationship>prop:ref:#ProductRelationshipItem>obj:#/c/s/productRelationship>prop:scalar:relationshipType',
  ];
  await run('js-mva-homepage-product-selector_v3.yaml', paths, 3, 2);
});

test('test_008_testHomepageProductSelectorAnonymousObject 02', async () => {
  const paths = [
    'get:/productSelectorItems>res:r>ref:#/c/s/productSelectorItems>array:ProductSelectorItemsItem>obj:ProductSelectorItemsItem>prop:array:#productRelationship>prop:ref:#ProductRelationshipItem>obj:#/c/s/productRelationship>prop:scalar:relationshipType',
    'get:/productSelectorItems>res:r>ref:#/c/s/productSelectorItems>array:ProductSelectorItemsItem>obj:ProductSelectorItemsItem>prop:array:#productRelationship>prop:ref:#ProductRelationshipItem>obj:#/c/s/productRelationship>prop:obj:product>obj:product>prop:scalar:id',
    'get:/productSelectorItems>res:r>ref:#/c/s/productSelectorItems>array:ProductSelectorItemsItem>obj:ProductSelectorItemsItem>prop:array:#productRelationship>prop:ref:#ProductRelationshipItem>obj:#/c/s/productRelationship>prop:obj:product>obj:product>prop:scalar:name',
    'get:/productSelectorItems>res:r>ref:#/c/s/productSelectorItems>array:ProductSelectorItemsItem>obj:ProductSelectorItemsItem>prop:array:#productRelationship>prop:ref:#ProductRelationshipItem>obj:#/c/s/productRelationship>prop:obj:product>obj:product>prop:scalar:type',
  ];
  await run('js-mva-homepage-product-selector_v3.yaml', paths, 3, 3);
});

test('test_009_Customer360_ScalarsOnly', async () => {
  const paths = [
    'get:/customer360/{id}>res:r>ref:#/c/s/Customer360>comp:#/c/s/Customer360>ref:#/c/s/Entity>comp:#/c/s/Entity>ref:#/c/s/Addressable>obj:#/c/s/Addressable>prop:scalar:id',
  ];

  await run('TMF717_Customer360-v5.0.0.oas.yaml', paths, 3, 5);
});

test('test_010_TMF633_IntentOrValue_to_Union', async () => {
  const paths = [
    'get:/product/{id}>res:r>ref:#/c/s/Product>comp:#/c/s/Product>ref:#/c/s/Entity>comp:#/c/s/Entity>ref:#/c/s/Addressable>obj:#/c/s/Addressable>prop:scalar:id',
    'get:/product/{id}>res:r>ref:#/c/s/Product>comp:#/c/s/Product>obj:[anonymous:#/c/s/Product]>prop:scalar:name',
    'get:/product/{id}>res:r>ref:#/c/s/Product>comp:#/c/s/Product>obj:[anonymous:#/c/s/Product]>prop:ref:#intent>comp:#/c/s/IntentRefOrValue>union:#/c/s/IntentRefOrValue>ref:#/c/s/Intent>comp:#/c/s/Intent>ref:#/c/s/Entity>comp:#/c/s/Entity>ref:#/c/s/Addressable>obj:#/c/s/Addressable>prop:scalar:id',
    'get:/product/{id}>res:r>ref:#/c/s/Product>comp:#/c/s/Product>obj:[anonymous:#/c/s/Product]>prop:ref:#intent>comp:#/c/s/IntentRefOrValue>union:#/c/s/IntentRefOrValue>ref:#/c/s/IntentRef>comp:#/c/s/IntentRef>ref:#/c/s/EntityRef>comp:#/c/s/EntityRef>obj:[anonymous:#/c/s/EntityRef]>prop:scalar:name',
    'get:/product/{id}>res:r>ref:#/c/s/Product>comp:#/c/s/Product>obj:[anonymous:#/c/s/Product]>prop:ref:#intent>comp:#/c/s/IntentRefOrValue>union:#/c/s/IntentRefOrValue>ref:#/c/s/Intent>comp:#/c/s/Intent>obj:[anonymous:#/c/s/Intent]>prop:scalar:description',
  ];

  await run('TMF637-001-UnionTest.yaml', paths, 1, 11);
});

test('test_011_TMF637_001_ComposedTest', async () => {
  const paths = [
    'get:/product/{id}>res:r>ref:#/c/s/Product>comp:#/c/s/Product>ref:#/c/s/Entity>comp:#/c/s/Entity>ref:#/c/s/Addressable>obj:#/c/s/Addressable>prop:scalar:id',
    'get:/product/{id}>res:r>ref:#/c/s/Product>comp:#/c/s/Product>obj:[anonymous:#/c/s/Product]>prop:scalar:name',
    'get:/product/{id}>res:r>ref:#/c/s/Product>comp:#/c/s/Product>obj:[anonymous:#/c/s/Product]>prop:ref:#billingAccount>comp:#/c/s/BillingAccountRef>ref:#/c/s/EntityRef>comp:#/c/s/EntityRef>ref:#/c/s/Extensible>obj:#/c/s/Extensible>prop:scalar:@baseType',
    'get:/product/{id}>res:r>ref:#/c/s/Product>comp:#/c/s/Product>obj:[anonymous:#/c/s/Product]>prop:ref:#billingAccount>comp:#/c/s/BillingAccountRef>ref:#/c/s/EntityRef>comp:#/c/s/EntityRef>obj:[anonymous:#/c/s/EntityRef]>prop:scalar:@referredType',
    'get:/product/{id}>res:r>ref:#/c/s/Product>comp:#/c/s/Product>obj:[anonymous:#/c/s/Product]>prop:ref:#billingAccount>comp:#/c/s/BillingAccountRef>ref:#/c/s/EntityRef>comp:#/c/s/EntityRef>ref:#/c/s/Extensible>obj:#/c/s/Extensible>prop:scalar:@schemaLocation',
    'get:/product/{id}>res:r>ref:#/c/s/Product>comp:#/c/s/Product>obj:[anonymous:#/c/s/Product]>prop:ref:#billingAccount>comp:#/c/s/BillingAccountRef>ref:#/c/s/EntityRef>comp:#/c/s/EntityRef>ref:#/c/s/Extensible>obj:#/c/s/Extensible>prop:scalar:@type',
    'get:/product/{id}>res:r>ref:#/c/s/Product>comp:#/c/s/Product>obj:[anonymous:#/c/s/Product]>prop:ref:#billingAccount>comp:#/c/s/BillingAccountRef>ref:#/c/s/EntityRef>comp:#/c/s/EntityRef>ref:#/c/s/Addressable>obj:#/c/s/Addressable>prop:scalar:href',
    'get:/product/{id}>res:r>ref:#/c/s/Product>comp:#/c/s/Product>obj:[anonymous:#/c/s/Product]>prop:ref:#billingAccount>comp:#/c/s/BillingAccountRef>ref:#/c/s/EntityRef>comp:#/c/s/EntityRef>ref:#/c/s/Addressable>obj:#/c/s/Addressable>prop:scalar:id',
    'get:/product/{id}>res:r>ref:#/c/s/Product>comp:#/c/s/Product>obj:[anonymous:#/c/s/Product]>prop:ref:#billingAccount>comp:#/c/s/BillingAccountRef>ref:#/c/s/EntityRef>comp:#/c/s/EntityRef>obj:[anonymous:#/c/s/EntityRef]>prop:scalar:name',
    'get:/product/{id}>res:r>ref:#/c/s/Product>comp:#/c/s/Product>obj:[anonymous:#/c/s/Product]>prop:ref:#billingAccount>comp:#/c/s/BillingAccountRef>obj:[anonymous:#/c/s/BillingAccountRef]>prop:scalar:ratingType',
  ];

  await run('TMF637-ProductInventory-v5.0.0.oas.yaml', paths, 2, 9);
});

/** checks that because we have a circular reference we can't find a type. this would never happen if the paths
 * were generated using the command line. */
test('test_013_testTMF637_TestSimpleRecursion no type found', async () => {
  const paths = [
    'get:/productById>res:r>ref:#/c/s/Product>comp:#/c/s/Product>obj:#/c/s/Product>prop:scalar:sku',
    'get:/productById>res:r>ref:#/c/s/Product>comp:#/c/s/Product>obj:#/c/s/Product>prop:ref:#relatedProduct>comp:#/c/s/Product>obj:#/c/s/Product>prop:scalar:sku',
  ];

  // two checks in the run function + 1 here
  expect.assertions(4);
  try {
    await run('TMF637-002-SimpleRecursionTest.yaml', paths, 1, 2, true);
  } catch (error) {
    console.error(error);
    expect(error).toBeDefined();
    expect((error as any).message).toContain('Could not find type');
  }
});

test('test_014_testTMF637_TestRecursion', async () => {
  const paths = [
    'get:/productById>res:r>ref:#/c/s/Product>comp:#/c/s/Product>ref:#/c/s/Entity>obj:#/c/s/Entity>prop:scalar:href',
    'get:/productById>res:r>ref:#/c/s/Product>comp:#/c/s/Product>ref:#/c/s/Entity>obj:#/c/s/Entity>prop:scalar:id',
    'get:/productById>res:r>ref:#/c/s/Product>comp:#/c/s/Product>obj:[anonymous:#/c/s/Product]>prop:scalar:terminationDate',
    'get:/productById>res:r>ref:#/c/s/Product>comp:#/c/s/Product>obj:[anonymous:#/c/s/Product]>prop:array:#relatedParty',
    'get:/productById>res:r>ref:#/c/s/Product>comp:#/c/s/Product>obj:[anonymous:#/c/s/Product]>prop:array:#relatedParty>prop:ref:#RelatedPartyItem>comp:#/c/s/RelatedPartyOrPartyRole>ref:#/c/s/Extensible>obj:#/c/s/Extensible>prop:scalar:@baseType',
    'get:/productById>res:r>ref:#/c/s/Product>comp:#/c/s/Product>obj:[anonymous:#/c/s/Product]>prop:array:#relatedParty>prop:ref:#RelatedPartyItem>comp:#/c/s/RelatedPartyOrPartyRole>ref:#/c/s/Extensible>obj:#/c/s/Extensible>prop:scalar:@schemaLocation',
    'get:/productById>res:r>ref:#/c/s/Product>comp:#/c/s/Product>obj:[anonymous:#/c/s/Product]>prop:array:#relatedParty>prop:ref:#RelatedPartyItem>comp:#/c/s/RelatedPartyOrPartyRole>ref:#/c/s/Extensible>obj:#/c/s/Extensible>prop:scalar:@type',
    'get:/productById>res:r>ref:#/c/s/Product>comp:#/c/s/Product>obj:[anonymous:#/c/s/Product]>prop:array:#relatedParty>prop:ref:#RelatedPartyItem>comp:#/c/s/RelatedPartyOrPartyRole>obj:[anonymous:#/c/s/RelatedPartyOrPartyRole]>prop:scalar:role',
    'get:/productById>res:r>ref:#/c/s/Product>comp:#/c/s/Product>obj:[anonymous:#/c/s/Product]>prop:array:#relatedParty>prop:ref:#RelatedPartyItem>comp:#/c/s/RelatedPartyOrPartyRole>obj:[anonymous:#/c/s/RelatedPartyOrPartyRole]>prop:ref:#partyOrPartyRole>comp:#/c/s/PartyOrPartyRole>union:#/c/s/PartyOrPartyRole>ref:#/c/s/Producer>comp:#/c/s/Producer>ref:#/c/s/PartyRole>comp:#/c/s/PartyRole>ref:#/c/s/Entity>obj:#/c/s/Entity>prop:scalar:href',
    'get:/productById>res:r>ref:#/c/s/Product>comp:#/c/s/Product>obj:[anonymous:#/c/s/Product]>prop:array:#relatedParty>prop:ref:#RelatedPartyItem>comp:#/c/s/RelatedPartyOrPartyRole>obj:[anonymous:#/c/s/RelatedPartyOrPartyRole]>prop:ref:#partyOrPartyRole>comp:#/c/s/PartyOrPartyRole>union:#/c/s/PartyOrPartyRole>ref:#/c/s/Producer>comp:#/c/s/Producer>ref:#/c/s/PartyRole>comp:#/c/s/PartyRole>ref:#/c/s/Entity>obj:#/c/s/Entity>prop:scalar:id',
    'get:/productById>res:r>ref:#/c/s/Product>comp:#/c/s/Product>obj:[anonymous:#/c/s/Product]>prop:array:#relatedParty>prop:ref:#RelatedPartyItem>comp:#/c/s/RelatedPartyOrPartyRole>obj:[anonymous:#/c/s/RelatedPartyOrPartyRole]>prop:ref:#partyOrPartyRole>comp:#/c/s/PartyOrPartyRole>union:#/c/s/PartyOrPartyRole>ref:#/c/s/Producer>comp:#/c/s/Producer>ref:#/c/s/PartyRole>comp:#/c/s/PartyRole>obj:[anonymous:#/c/s/PartyRole]>prop:scalar:name',
    'get:/productById>res:r>ref:#/c/s/Product>comp:#/c/s/Product>obj:[anonymous:#/c/s/Product]>prop:array:#relatedParty>prop:ref:#RelatedPartyItem>comp:#/c/s/RelatedPartyOrPartyRole>obj:[anonymous:#/c/s/RelatedPartyOrPartyRole]>prop:ref:#partyOrPartyRole>comp:#/c/s/PartyOrPartyRole>union:#/c/s/PartyOrPartyRole>ref:#/c/s/Producer>comp:#/c/s/Producer>ref:#/c/s/PartyRole>comp:#/c/s/PartyRole>obj:[anonymous:#/c/s/PartyRole]>circular-ref:#prop:array:#relatedParty',
  ];

  expect.assertions(6);
  const error = await run('TMF637-002-RecursionTest.yaml', paths, 1, 10);
  // expect(error).toContain("Circular reference detected in `@connect(selection:)` on `Query.productById`");
});

test('test_015_testTMF637_ProductStatusEnum', async () => {
  const paths = [
    'get:/product/{id}>res:r>ref:#/c/s/Product>comp:#/c/s/Product>obj:[anonymous:#/c/s/Product]>prop:ref:#status>enum:#/c/s/ProductStatusType',
  ];
  const output = await run(
    'TMF637-ProductInventory-v5.0.0.oas.yaml',
    paths,
    2,
    6
  );
});

test('test_016_testMostPopularProductScalarsOnly', async () => {
  const paths = [
    'get:/emailed/{period}.json>res:r>obj:emailedByPeriodJsonResponse>prop:scalar:copyright',
    'get:/emailed/{period}.json>res:r>obj:emailedByPeriodJsonResponse>prop:scalar:num_results',
    'get:/emailed/{period}.json>res:r>obj:emailedByPeriodJsonResponse>prop:scalar:status',
  ];
  await run('most-popular-product.yaml', paths, 4, 1);
});

test('test_017_testMostPopularProduct', async () => {
  const paths = [
    'get:/emailed/{period}.json>res:r>obj:emailedByPeriodJsonResponse>prop:scalar:copyright',
    'get:/emailed/{period}.json>res:r>obj:emailedByPeriodJsonResponse>prop:scalar:num_results',
    'get:/emailed/{period}.json>res:r>obj:emailedByPeriodJsonResponse>prop:scalar:status',
    'get:/emailed/{period}.json>res:r>obj:emailedByPeriodJsonResponse>prop:array:#results>prop:ref:#ResultsItem>obj:#/c/s/EmailedArticle>prop:scalar:abstract',
    'get:/emailed/{period}.json>res:r>obj:emailedByPeriodJsonResponse>prop:array:#results>prop:ref:#ResultsItem>obj:#/c/s/EmailedArticle>prop:scalar:adx_keywords',
    'get:/emailed/{period}.json>res:r>obj:emailedByPeriodJsonResponse>prop:array:#results>prop:ref:#ResultsItem>obj:#/c/s/EmailedArticle>prop:scalar:asset_id',
    'get:/emailed/{period}.json>res:r>obj:emailedByPeriodJsonResponse>prop:array:#results>prop:ref:#ResultsItem>obj:#/c/s/EmailedArticle>prop:scalar:byline',
    'get:/emailed/{period}.json>res:r>obj:emailedByPeriodJsonResponse>prop:array:#results>prop:ref:#ResultsItem>obj:#/c/s/EmailedArticle>prop:scalar:column',
    'get:/emailed/{period}.json>res:r>obj:emailedByPeriodJsonResponse>prop:array:#results>prop:ref:#ResultsItem>obj:#/c/s/EmailedArticle>prop:array:#des_facet',
    'get:/emailed/{period}.json>res:r>obj:emailedByPeriodJsonResponse>prop:array:#results>prop:ref:#ResultsItem>obj:#/c/s/EmailedArticle>prop:scalar:eta_id',
    'get:/emailed/{period}.json>res:r>obj:emailedByPeriodJsonResponse>prop:array:#results>prop:ref:#ResultsItem>obj:#/c/s/EmailedArticle>prop:array:#geo_facet',
    'get:/emailed/{period}.json>res:r>obj:emailedByPeriodJsonResponse>prop:array:#results>prop:ref:#ResultsItem>obj:#/c/s/EmailedArticle>prop:scalar:id',
    'get:/emailed/{period}.json>res:r>obj:emailedByPeriodJsonResponse>prop:array:#results>prop:ref:#ResultsItem>obj:#/c/s/EmailedArticle>prop:scalar:nytdsection',
    'get:/emailed/{period}.json>res:r>obj:emailedByPeriodJsonResponse>prop:array:#results>prop:ref:#ResultsItem>obj:#/c/s/EmailedArticle>prop:array:#org_facet',
    'get:/emailed/{period}.json>res:r>obj:emailedByPeriodJsonResponse>prop:array:#results>prop:ref:#ResultsItem>obj:#/c/s/EmailedArticle>prop:array:#per_facet',
    'get:/emailed/{period}.json>res:r>obj:emailedByPeriodJsonResponse>prop:array:#results>prop:ref:#ResultsItem>obj:#/c/s/EmailedArticle>prop:scalar:published_date',
    'get:/emailed/{period}.json>res:r>obj:emailedByPeriodJsonResponse>prop:array:#results>prop:ref:#ResultsItem>obj:#/c/s/EmailedArticle>prop:scalar:section',
    'get:/emailed/{period}.json>res:r>obj:emailedByPeriodJsonResponse>prop:array:#results>prop:ref:#ResultsItem>obj:#/c/s/EmailedArticle>prop:scalar:source',
    'get:/emailed/{period}.json>res:r>obj:emailedByPeriodJsonResponse>prop:array:#results>prop:ref:#ResultsItem>obj:#/c/s/EmailedArticle>prop:scalar:subsection',
    'get:/emailed/{period}.json>res:r>obj:emailedByPeriodJsonResponse>prop:array:#results>prop:ref:#ResultsItem>obj:#/c/s/EmailedArticle>prop:scalar:title',
    'get:/emailed/{period}.json>res:r>obj:emailedByPeriodJsonResponse>prop:array:#results>prop:ref:#ResultsItem>obj:#/c/s/EmailedArticle>prop:scalar:type',
    'get:/emailed/{period}.json>res:r>obj:emailedByPeriodJsonResponse>prop:array:#results>prop:ref:#ResultsItem>obj:#/c/s/EmailedArticle>prop:scalar:updated',
    'get:/emailed/{period}.json>res:r>obj:emailedByPeriodJsonResponse>prop:array:#results>prop:ref:#ResultsItem>obj:#/c/s/EmailedArticle>prop:scalar:uri',
    'get:/emailed/{period}.json>res:r>obj:emailedByPeriodJsonResponse>prop:array:#results>prop:ref:#ResultsItem>obj:#/c/s/EmailedArticle>prop:scalar:url',
    'get:/emailed/{period}.json>res:r>obj:emailedByPeriodJsonResponse>prop:array:#results>prop:ref:#ResultsItem>obj:#/c/s/EmailedArticle>prop:array:#media>prop:ref:#MediaItem>obj:#/c/s/Media>prop:scalar:approved_for_syndication',
    'get:/emailed/{period}.json>res:r>obj:emailedByPeriodJsonResponse>prop:array:#results>prop:ref:#ResultsItem>obj:#/c/s/EmailedArticle>prop:array:#media>prop:ref:#MediaItem>obj:#/c/s/Media>prop:scalar:caption',
    'get:/emailed/{period}.json>res:r>obj:emailedByPeriodJsonResponse>prop:array:#results>prop:ref:#ResultsItem>obj:#/c/s/EmailedArticle>prop:array:#media>prop:ref:#MediaItem>obj:#/c/s/Media>prop:scalar:copyright',
    'get:/emailed/{period}.json>res:r>obj:emailedByPeriodJsonResponse>prop:array:#results>prop:ref:#ResultsItem>obj:#/c/s/EmailedArticle>prop:array:#media>prop:ref:#MediaItem>obj:#/c/s/Media>prop:scalar:subtype',
    'get:/emailed/{period}.json>res:r>obj:emailedByPeriodJsonResponse>prop:array:#results>prop:ref:#ResultsItem>obj:#/c/s/EmailedArticle>prop:array:#media>prop:ref:#MediaItem>obj:#/c/s/Media>prop:scalar:type',
    'get:/emailed/{period}.json>res:r>obj:emailedByPeriodJsonResponse>prop:array:#results>prop:ref:#ResultsItem>obj:#/c/s/EmailedArticle>prop:array:#media>prop:ref:#MediaItem>obj:#/c/s/Media>prop:array:#media-metadata>prop:ref:#MediaMetadataItem>obj:#/c/s/MediaMetadata>prop:scalar:format',
    'get:/emailed/{period}.json>res:r>obj:emailedByPeriodJsonResponse>prop:array:#results>prop:ref:#ResultsItem>obj:#/c/s/EmailedArticle>prop:array:#media>prop:ref:#MediaItem>obj:#/c/s/Media>prop:array:#media-metadata>prop:ref:#MediaMetadataItem>obj:#/c/s/MediaMetadata>prop:scalar:height',
    'get:/emailed/{period}.json>res:r>obj:emailedByPeriodJsonResponse>prop:array:#results>prop:ref:#ResultsItem>obj:#/c/s/EmailedArticle>prop:array:#media>prop:ref:#MediaItem>obj:#/c/s/Media>prop:array:#media-metadata>prop:ref:#MediaMetadataItem>obj:#/c/s/MediaMetadata>prop:scalar:url',
    'get:/emailed/{period}.json>res:r>obj:emailedByPeriodJsonResponse>prop:array:#results>prop:ref:#ResultsItem>obj:#/c/s/EmailedArticle>prop:array:#media>prop:ref:#MediaItem>obj:#/c/s/Media>prop:array:#media-metadata>prop:ref:#MediaMetadataItem>obj:#/c/s/MediaMetadata>prop:scalar:width',
  ];

  await run('most-popular-product.yaml', paths, 4, 4);
});

test('test_017_testMostPopularProduct_star', async () => {
  const paths = [
    'get:/emailed/{period}.json>res:r>obj:emailedByPeriodJsonResponse>*',
  ];

  await run('most-popular-product.yaml', paths, 4, 1);
});

test('test_017_testMostPopularProduct_double-star', async () => {
  const paths = ['get:/emailed/{period}.json>**'];

  await run('most-popular-product.yaml', paths, 4, 4);
});

test('test_017_testMostPopularProduct_double-star - partial paths', async () => {
  const paths = [
    'get:/emailed/{period}.json>res:r>obj:emailedByPeriodJsonResponse>prop:array:#results>prop:ref:#ResultsItem>obj:#/c/s/EmailedArticle>**',
  ];

  await run('most-popular-product.yaml', paths, 4, 4);
});

test('test_018_testTMF637_01', async () => {
  const paths = [
    'get:/product>res:r>array:#/c/s/Product>ref:#/c/s/Product>comp:#/c/s/Product>ref:#/c/s/Entity>comp:#/c/s/Entity>ref:#/c/s/Addressable>obj:#/c/s/Addressable>prop:scalar:id',
    'get:/product>res:r>array:#/c/s/Product>ref:#/c/s/Product>comp:#/c/s/Product>obj:[anonymous:#/c/s/Product]>prop:array:#agreementItem>prop:ref:#AgreementItemItem>comp:#/c/s/AgreementItemRef>obj:[anonymous:#/c/s/AgreementItemRef]>prop:scalar:agreementId',
    'get:/product>res:r>array:#/c/s/Product>ref:#/c/s/Product>comp:#/c/s/Product>obj:[anonymous:#/c/s/Product]>prop:array:#agreementItem>prop:ref:#AgreementItemItem>comp:#/c/s/AgreementItemRef>obj:[anonymous:#/c/s/AgreementItemRef]>prop:scalar:agreementName',
    'get:/product>res:r>array:#/c/s/Product>ref:#/c/s/Product>comp:#/c/s/Product>obj:[anonymous:#/c/s/Product]>prop:ref:#billingAccount>comp:#/c/s/BillingAccountRef>ref:#/c/s/EntityRef>comp:#/c/s/EntityRef>obj:[anonymous:#/c/s/EntityRef]>prop:scalar:name',
    'get:/product>res:r>array:#/c/s/Product>ref:#/c/s/Product>comp:#/c/s/Product>obj:[anonymous:#/c/s/Product]>prop:ref:#billingAccount>comp:#/c/s/BillingAccountRef>obj:[anonymous:#/c/s/BillingAccountRef]>prop:scalar:ratingType',
    'get:/product>res:r>array:#/c/s/Product>ref:#/c/s/Product>comp:#/c/s/Product>obj:[anonymous:#/c/s/Product]>prop:ref:#billingAccount>comp:#/c/s/BillingAccountRef>ref:#/c/s/EntityRef>comp:#/c/s/EntityRef>ref:#/c/s/Addressable>obj:#/c/s/Addressable>prop:scalar:id',
  ];
  await run('TMF637-ProductInventory-v5.0.0.oas.yaml', paths, 2, 11);
});

test('test_018_testTMF637_02', async () => {
  const paths = [
    'get:/product>res:r>array:#/c/s/Product>ref:#/c/s/Product>comp:#/c/s/Product>obj:[anonymous:#/c/s/Product]>prop:array:#agreementItem>prop:ref:#AgreementItemItem>comp:#/c/s/AgreementItemRef>ref:#/c/s/Extensible>obj:#/c/s/Extensible>prop:scalar:@baseType',
  ];
  await run('TMF637-ProductInventory-v5.0.0.oas.yaml', paths, 2, 7);
});

test('test_018_testTMF637_SimpleRecursion', async () => {
  const paths = ['get:/productById>**'];
  await run('TMF637-002-SimpleRecursionTest.yaml', paths, 1, 3);
  // await run("TMF637-ProductInventory-v5.0.0.oas.yaml", paths, 2, 136);
});

test('test_019_testUnionInParam', async () => {
  const paths = [
    'get:/consumer/{id}>res:r>ref:#/c/s/Consumer>obj:#/c/s/Consumer>prop:array:#accounts>prop:ref:#AccountsItem>obj:#/c/s/Account>prop:scalar:id',
    'get:/consumer/{id}>res:r>ref:#/c/s/Consumer>obj:#/c/s/Consumer>prop:array:#accounts>prop:ref:#AccountsItem>obj:#/c/s/Account>prop:scalar:state',
    'get:/consumer/{id}>res:r>ref:#/c/s/Consumer>obj:#/c/s/Consumer>prop:array:#accounts>prop:ref:#AccountsItem>obj:#/c/s/Account>prop:scalar:stateReason',
    'get:/consumer/{id}>res:r>ref:#/c/s/Consumer>obj:#/c/s/Consumer>prop:scalar:birthDate',
    'get:/consumer/{id}>res:r>ref:#/c/s/Consumer>obj:#/c/s/Consumer>prop:scalar:firstName',
    'get:/consumer/{id}>res:r>ref:#/c/s/Consumer>obj:#/c/s/Consumer>prop:scalar:gender',
    'get:/consumer/{id}>res:r>ref:#/c/s/Consumer>obj:#/c/s/Consumer>prop:scalar:lastName',
    'get:/consumer/{id}>res:r>ref:#/c/s/Consumer>obj:#/c/s/Consumer>prop:scalar:me',
    'get:/consumer/{id}>res:r>ref:#/c/s/Consumer>obj:#/c/s/Consumer>prop:scalar:taxIdentifier',
    'get:/consumer/{id}>res:r>ref:#/c/s/Consumer>obj:#/c/s/Consumer>prop:scalar:title',
  ];

  await run('js-mva-consumer-info_v1.yaml', paths, 1, 3);
});

test('test_020_testDuplicateRefPath', async () => {
  const paths = [
    'get:/productSelectorItems>res:r>ref:#/c/s/productSelectorItems>array:ProductSelectorItemsItem>obj:ProductSelectorItemsItem>prop:array:#productPrice>prop:ref:#ProductPriceItem>obj:#/c/s/productPrice>prop:ref:#price>obj:#/c/s/price>prop:ref:#dutyFreeAmount>obj:#/c/s/money>prop:scalar:unit',
    'get:/productSelectorItems>res:r>ref:#/c/s/productSelectorItems>array:ProductSelectorItemsItem>obj:ProductSelectorItemsItem>prop:array:#productPrice>prop:ref:#ProductPriceItem>obj:#/c/s/productPrice>prop:ref:#price>obj:#/c/s/price>prop:ref:#dutyFreeAmount>obj:#/c/s/money>prop:scalar:value',
    'get:/productSelectorItems>res:r>ref:#/c/s/productSelectorItems>array:ProductSelectorItemsItem>obj:ProductSelectorItemsItem>prop:array:#productPrice>prop:ref:#ProductPriceItem>obj:#/c/s/productPrice>prop:ref:#price>obj:#/c/s/price>prop:ref:#taxIncludedAmount>obj:#/c/s/money>prop:scalar:unit',
    'get:/productSelectorItems>res:r>ref:#/c/s/productSelectorItems>array:ProductSelectorItemsItem>obj:ProductSelectorItemsItem>prop:array:#productPrice>prop:ref:#ProductPriceItem>obj:#/c/s/productPrice>prop:ref:#price>obj:#/c/s/price>prop:ref:#taxIncludedAmount>obj:#/c/s/money>prop:scalar:value',
    'get:/productSelectorItems>res:r>ref:#/c/s/productSelectorItems>array:ProductSelectorItemsItem>obj:ProductSelectorItemsItem>prop:array:#productPrice>prop:ref:#ProductPriceItem>obj:#/c/s/productPrice>prop:scalar:priceType',
    'get:/productSelectorItems>res:r>ref:#/c/s/productSelectorItems>array:ProductSelectorItemsItem>obj:ProductSelectorItemsItem>prop:array:#productPrice>prop:ref:#ProductPriceItem>obj:#/c/s/productPrice>prop:scalar:recurringChargePeriod',
  ];

  await run('js-mva-homepage-product-selector_v3.yaml', paths, 3, 4);
});

test('test_021_testInlineItemsArray', async () => {
  const paths = [
    'get:/productSelectorItemDetails>res:r>ref:#/c/s/productSelectorItemDetails>obj:#/c/s/productSelectorItemDetails>prop:array:#usageConsumption>prop:obj:UsageConsumptionItem>obj:UsageConsumptionItem>prop:scalar:productId',
  ];
  await run('js-mva-homepage-product-selector_v3.yaml', paths, 3, 2);
});

test('test_022_common-room_01', async () => {
  const paths = [
    'get:/activityTypes>**',
    'get:/api-token-status>**',
    'get:/members>**',
    'get:/members/customFields>**',
    'get:/segments>**',
    'get:/segments/:id/status>**',
    'get:/tags>**',
    'get:/tags/{id}>**',
    'get:/user/{email}>**',
  ];

  // last 2 args: don't expect to fail, and skip validation
  await run('common-room-core.json', paths, 9, 15, false, true);
  // await run("common-room-original.json", paths, 9, 16, false, true);
});

test('test_024_TMF632_IndividualIdentification', async () => {
  const paths = [
    'get:/individual/{id}>res:r>ref:#/c/s/Individual>comp:#/c/s/Individual>ref:#/c/s/Party>comp:#/c/s/Party>ref:#/c/s/Entity>comp:#/c/s/Entity>ref:#/c/s/Addressable>obj:#/c/s/Addressable>prop:scalar:id',
    'get:/individual/{id}>res:r>ref:#/c/s/Individual>comp:#/c/s/Individual>obj:[anonymous:#/c/s/Individual]>prop:array:#individualIdentification>prop:ref:#IndividualIdentificationItem>comp:#/c/s/IndividualIdentification>obj:[anonymous:#/c/s/IndividualIdentification]>prop:scalar:identificationId',
  ];
  await run('TMF632-Party_Management-v5.0.0.oas.yaml', paths, 4, 9);
});

test('test_025_AdobeCommerce', async () => {
  const paths = [
    'get:/V1/carts/licence>res:r>array:#/c/s/checkout-agreements-data-agreement-interface>ref:#/c/s/checkout-agreements-data-agreement-interface>obj:#/c/s/checkout-agreements-data-agreement-interface>prop:scalar:agreement_id',
    'get:/V1/carts/licence>res:r>array:#/c/s/checkout-agreements-data-agreement-interface>ref:#/c/s/checkout-agreements-data-agreement-interface>obj:#/c/s/checkout-agreements-data-agreement-interface>prop:scalar:checkbox_text',
    'get:/V1/carts/licence>res:r>array:#/c/s/checkout-agreements-data-agreement-interface>ref:#/c/s/checkout-agreements-data-agreement-interface>obj:#/c/s/checkout-agreements-data-agreement-interface>prop:scalar:content',
    'get:/V1/carts/licence>res:r>array:#/c/s/checkout-agreements-data-agreement-interface>ref:#/c/s/checkout-agreements-data-agreement-interface>obj:#/c/s/checkout-agreements-data-agreement-interface>prop:scalar:content_height',
    'get:/V1/carts/licence>res:r>array:#/c/s/checkout-agreements-data-agreement-interface>ref:#/c/s/checkout-agreements-data-agreement-interface>obj:#/c/s/checkout-agreements-data-agreement-interface>prop:scalar:is_active',
    'get:/V1/carts/licence>res:r>array:#/c/s/checkout-agreements-data-agreement-interface>ref:#/c/s/checkout-agreements-data-agreement-interface>obj:#/c/s/checkout-agreements-data-agreement-interface>prop:scalar:is_html',
    'get:/V1/carts/licence>res:r>array:#/c/s/checkout-agreements-data-agreement-interface>ref:#/c/s/checkout-agreements-data-agreement-interface>obj:#/c/s/checkout-agreements-data-agreement-interface>prop:scalar:mode',
    'get:/V1/carts/licence>res:r>array:#/c/s/checkout-agreements-data-agreement-interface>ref:#/c/s/checkout-agreements-data-agreement-interface>obj:#/c/s/checkout-agreements-data-agreement-interface>prop:scalar:name',
  ];
  await run('adobe-commerce-swagger.json', paths, 242, 1);
});

test('test_025_AdobeCommerce_customer-paths', async () => {
  const paths = [
    'get:/V1/customers/{customerId}>**',
    'get:/V1/customers/{customerId}/billingAddress>**',
    'get:/V1/customers/{customerId}/companies>**',
    'get:/V1/customers/{customerId}/companies/{companyId}>**',
    'get:/V1/customers/{customerId}/confirm>**',
    'get:/V1/customers/{customerId}/password/resetLinkToken/{resetPasswordLinkToken}>**',
    'get:/V1/customers/{customerId}/permissions/readonly>**',
    'get:/V1/customers/{customerId}/shippingAddress>**',
    'get:/V1/customers/addresses/{addressId}>**',
    'get:/V1/customers/companies>**',
    'get:/V1/customers/me>**',
    'get:/V1/customers/me/billingAddress>**',
    'get:/V1/customers/me/shippingAddress>**',
    'get:/V1/customers/search>**',
  ];
  await run('adobe-commerce-swagger.json', paths, 242, 18);
});

test('test_026_petstore-paths', async () => {
  const paths = [
    'get:/pet/{petId}>**',
    'get:/pet/findByStatus>**',
    'get:/pet/findByTags>**',
    'get:/store/inventory>**',
    'get:/store/order/{orderId}>**',
    'get:/user/{username}>**',
    'get:/user/login>**',
    'get:/user/logout>**',
  ];

  await run(`petstore.yaml`, paths, 8, 6);
});

test('test_026_petstore-status-enum', async () => {
  const paths = [
    'get:/pet/findByStatus>res:r>array:#/c/s/Pet>ref:#/c/s/Pet>obj:#/c/s/Pet>prop:scalar:id',
    'get:/pet/findByStatus>res:r>array:#/c/s/Pet>ref:#/c/s/Pet>obj:#/c/s/Pet>prop:scalar:name',
    'get:/pet/findByStatus>res:r>array:#/c/s/Pet>ref:#/c/s/Pet>obj:#/c/s/Pet>prop:array:#photoUrls',
    'get:/pet/findByStatus>res:r>array:#/c/s/Pet>ref:#/c/s/Pet>obj:#/c/s/Pet>prop:scalar:status'
  ];

  await run(`petstore.yaml`, paths, 8, 1);
});

// run test
async function run(
  file: string,
  paths: string[],
  pathsSize: number,
  typesSize: number,
  shouldFail: boolean = false,
  skipValidation: boolean = false
): Promise<string | undefined> {
  const gen = await Gen.fromFile(`${base}/${file}`, { skipValidation });
  await gen.visit();

  expect(gen.paths).toBeDefined();
  expect(gen.paths.size).toBe(pathsSize);

  const writer: Writer = new Writer(gen);

  try {
    writer.generate(paths);
  } catch (err) {
    throw err;
  }

  expect(gen.context?.types.size).toBe(typesSize);

  const schema = writer.flush();
  expect(schema).toBeDefined();

  const schemaFile = path.join(
    os.tmpdir(),
    file.replace(/yaml|json|yml/, 'graphql')
  );
  fs.writeFileSync(schemaFile, schema, { encoding: 'utf-8', flag: 'w' });

  const [result, output] = compose(schemaFile);
  if (shouldFail) {
    expect(result).toBeFalsy();
    expect(output).toBeDefined();
    return output;
  } else {
    expect(output).toBeUndefined();
    expect(result).toBeTruthy();
  }
}

/// rover checks
function isRoverAvailable(command: string): [boolean, string?] {
  const cmd = os.platform() === 'win32' ? 'where' : 'which';
  const result = spawnSync(cmd, [command], { encoding: 'utf8' });

  return [result.status === 0, result.stdout.toString().trim()];
}

function compose(schemaPath: string) {
  console.log('schemaPath', schemaPath);

  let rover: [boolean, (string | undefined)?] = isRoverAvailable('rover');
  if (!rover[0]) {
    throw new Error('Rover is not available');
  }

  const supergraphFile = path.join(os.tmpdir(), 'supergraph.yaml');
  const content: string = `
federation_version: =2.10.0
subgraphs:
  test_spec:
    routing_url: http://localhost # this value is ignored
    schema:
      file: ${schemaPath} # path to the schema file`;

  fs.writeFileSync(supergraphFile, content, { encoding: 'utf-8', flag: 'w' });

  const cmd = `${rover[1]} supergraph compose --config ${supergraphFile} --elv2-license accept`;

  let output;
  try {
    output = execSync(cmd, { stdio: 'pipe' });
    return [true, undefined];
  } catch (error: any) {
    return [false, error?.message];
  }
}
