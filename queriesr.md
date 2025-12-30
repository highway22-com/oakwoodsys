````bash
query post {
  pages {
    nodes {
      uri
      title
      id
    }
  }
  page(id: "cG9zdDoxMA==") {
    contentType {
      node {
        id
      }
    }
    content(format: RENDERED)
  }
}
```

````

query MyQuery {
  page(id: "cG9zdDoxMA==") {
    id
    slug
    title(format: RAW)
    uri
  }
}

query MyQuery2 {
  properties {
    nodes {
      id
      uri
    }
  }
}

query MyQuery3 {
  nodeByUri(uri: "/property/home/") {
    ... on Property {
      id
      jsonFeatures {
        json
      }
      jsonFile{
        jsonfile {
          id
        }
      }
    }
  }
}

````
