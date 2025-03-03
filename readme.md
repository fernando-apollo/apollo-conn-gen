# OAS to Apollo Connector Generator

## Introduction

The OAS to Apollo Connector Generator is a tool designed to create
an [Apollo GraphQL Connector](https://www.apollographql.com/docs/apollo-server/) from an OpenAPI Specification (OAS)
file. It supports OAS versions 3.x and above, accepting input files in both YAML and JSON formats.

*Note: This project is experimental. Not all OAS specification options are currently supported, and you may encounter
bugs or unimplemented features. Contributions, bug reports, and feedback are highly appreciated. If you have specific
OAS files you'd like to add to our test suite, please share them.*

## Prerequisites

- [Node.js](https://nodejs.org/) version 18 or higher. Typescript version 5.1.6.

## Installation

1. **Clone the Repository**:

   ```bash
   git clone https://github.com/fernando-apollo/oas-to-connector.git
   cd oas-to-connector
   ```

2. **Install Dependencies**:

   ```bash
   npm install
   ```

3. **Build the Project**:

   ```bash
   npm run build
   ```

   Alternatively, if you prefer using `ts-node`:

   ```bash
   npm install -g ts-node
   ```

   And run the CLI with:

    ```shell
    node ./dist/index.js -h
    Usage: index [options] <source>
    
    Arguments:
      source                source spec (yaml or json)
    
    Options:
      -V, --version         output the version number
      -i --skip-validation  Skip validation step (default: false)
      -n --skip-selection   Generate all [filtered] paths without prompting for a selection (default: false)
      -l --list-paths       Only list the paths that can be generated (default: false)
      -g --grep <regex>     Filter the list of paths with the passed expression (default: "*")
      -p --page-size <num>  Number of rows to display in selection mode (default: "10")
      -h, --help            display help for command
    ```

## Usage

To generate an Apollo Connector from your OAS file, run:

```bash
node ./dist/index.js <path-to-your-oas-file>
```

Replace `<path-to-your-oas-file>` with the relative or absolute path to your OAS YAML or JSON file.

### Example with Petstore

*Note: the petstore spec can be downloaded from (<https://petstore3.swagger.io>)*

```bash
node ./dist/index.js ./tests/petstore.yaml
```

The output should be similar to the following:
![Screenshot showing a list of paths available to generate](./docs/screenshot-01.png)

### Selecting fields

Navigate using the `arrow` keys and select the fields you want to include in the generated connector schema using the 'x' key. Other options are:

- `a` to select all fields in the current type, or
- `n` key to deselect all fields.

Once you've made your selection, press the `Enter` key to generate the Apollo Connector.

Here's an example of the output when selecting all the fields from `[GET] /pet/{petId`:

```graphql
extend schema
  @link(url: "https://specs.apollo.dev/federation/v2.10", import: ["@key"])
  @link(
    url: "https://specs.apollo.dev/connect/v0.1"
    import: ["@connect", "@source"]
  )
  @source(name: "api", http: { baseURL: "https://petstore3.swagger.io/v3" })

scalar JSON

type Pet {
  category: Category
  id: Int
  name: String
  photoUrls: [String]
  "pet status in the store"
  status: String
  tags: [Tag]
}

type Category {
  id: Int
  name: String
}

type Tag {
  id: Int
  name: String
}

type Query {
  """
  Find pet by ID (/pet/{petId})
  """
  petByPetId(petId: Int!): Pet
    @connect(
      source: "api"
      http: { GET: "/pet/{$args.petId}" }
      selection: """
      category {
       id
       name
      }
      id
      name
      photoUrls
      status
      tags {
       id
       name
      }
      """
    )
}
```

## Options

- `-i, --skip-validation`: Skip the validation step (default: `false`).
- `-n, --skip-selection`: Generate all filtered paths without prompting for selection (default: `false`).
- `-l, --list-paths`: Only list the paths that can be generated (default: `false`).

For a complete list of options, run:

```bash
node ./dist/index.js -h
```

### Filtering paths

The tool allows filtering the list of paths using a regular expression. This is useful when you have large specs and only want to generate (or list) a subset. As shown above, you can list all the paths using the `-l` flag:

```shell
node ./dist/index.js ./tests/petstore.yaml --list-paths

get:/pet/{petId}
get:/pet/findByStatus
get:/pet/findByTags
get:/store/inventory
get:/store/order/{orderId}
get:/user/{username}
get:/user/login
get:/user/logout
```

If you'd like to filter the paths using a regular expression, you can use the `-g` flag. For example, to only list the operations ending with an argument, you can use the following command:

```shell
node ./dist/index.js ./tests/petstore.yaml  --list-paths  --grep "{\\w+}$"

get:/pet/{petId}
get:/store/order/{orderId}
```

or, for instance, filtering by a specific path:

```shell
node ./dist/index.js ./tests/petstore.yaml  --list-paths  --grep "/pet/"

get:/pet/{petId}
get:/pet/findByTags
```

### Skipping validation

By default, the tool will validate the OAS specification before generating the Apollo Connector. However, sometimes specifications are not fully compliant with the OAS standard, or you may want to skip this step for other reasons. To do so, simply add the `-i` (or `--skip-validation`) flag to the command.

### Page size

When selecting paths, the tool will display a list of paths with a default page size of `10`. You can change this value using the `-p` (or `--page-size`) flag. For example, to display `40` rows per page, you can use the following command:

```shell
node ./dist/index.js ./tests/petstore.yaml  --page-size 40
```

## Generating all paths without selection

Whilst this option is not recommended for large specifications, you can generate all paths without prompting for a specific selection. To do so, you can use the `-n` (or `--skip-selection`) flag. This may result in a very large Apollo Connector schema, might take a long time to process and not be particularly useful, so use with caution.
