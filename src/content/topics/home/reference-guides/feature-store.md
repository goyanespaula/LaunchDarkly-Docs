---
title: "Using a persistent feature store"
excerpt: ""
---
## Overview
This topic explains how to use a persistent feature store to keep flag data.

In their default configuration, LaunchDarkly's server-side SDKs: 
* connect to LaunchDarkly and receive feature flag data
* store the flags in memory
* update the in-memory state if LaunchDarkly sends updates 

Flag evaluations always refer to the last known state in memory. This collection of last known flag data is the "feature store."

Alternatively, you can use a database for the feature store. Most of the server-side SDKs support Redis, DynamoDB, and Consul for this purpose. 

Whichever database you use, there are two ways to use it:
* Exactly like the default configuration, except substituting a database for the in-memory store, or
* Using _only_ the database as a source of flag data, without connecting to LaunchDarkly
## Using a persistent feature store while still connecting to LaunchDarkly
In this configuration, the SDK receives feature flag data from LaunchDarkly and puts it in the feature store. The only difference is that the store is in a database. 

When flags are evaluated, the SDK checks the database to get the latest flag state, usually with some form of in-memory caching to improve performance.

The main reason to do this is to accelerate flag updates when your application has to restart, and after restarting, it takes longer to establish a connection to LaunchDarkly than you want. If you have a persistent feature store that has already been populated, the SDK can still evaluate flags using the last known flag state from the store until newer data is available from LaunchDarkly.

To set up this configuration, most people create some kind of object for the specific type of database and put it in the client configuration's feature store property. In PHP, this property is called the "feature requester".

An example configuration is below:
[block:code]
{
  "codes": [
    {
      "code": "import ld \"gopkg.in/launchdarkly/go-server-sdk.v4\"
store, err := examplepackage.NewExampleFeatureStore(storeOptions)\nconfig := ld.DefaultConfig\nconfig.FeatureStore = store\nclient := ld.MakeCustomClient(sdkKey, config, waitTime)",
      "language": "go"
    },
    {
      "code": "import com.launchdarkly.client.*;
FeatureStoreFactory store = SomeKindOfFeatureStoreBuilder(storeOptions);\nConfig config = new Config.Builder()\n    .featureStoreFactory(store)\n    .build();\nLDClient client = new LDClient(sdkKey, config);",
      "language": "java"
    },
    {
      "code": "using LaunchDarkly.Client;
var store = createSomeKindOfFeatureStore();\nvar config = Configuration.Default(sdkKey)\n    .WithFeatureStoreFactory(store);\nvar client = new LDClient(config);",
      "language": "csharp",
      "name": ".NET"
    },
    {
      "code": "require 'ldclient-rb'
store = SomeKindOfFeatureStore.new(storeOptions)\nconfig = LaunchDarkly::Config.new(\n  feature_store: store\n)\nclient = LaunchDarkly::Client.new(sdk_key, config)",
      "language": "ruby"
    },
    {
      "code": "import ldclient\nfrom ldclient.config import Config
store = SomeKindOfFeatureStore(store_options)\nconfig = Config(feature_store=store)\nldclient.set_config(config)",
      "language": "python"
    },
    {
      "code": "const LaunchDarkly = require('ldclient-node');
const store = SomeKindOfFeatureStore(storeOptions);\nconst config = {\n  featureStore: store\n};\nconst client = LaunchDarkly.init(sdkKey, config);",
      "language": "javascript",
      "name": "Node.js"
    },
    {
      "code": "$client = new LaunchDarkly\\LDClient(\"your_sdk_key\", [\n    'feature_requester' => LaunchDarkly\\Integrations\\Redis::featureRequester()\n]);
// Prior to version 3.5.0, use this syntax:\n// $client = new LaunchDarkly\\LDClient(\"your_sdk_key\", [\n//     'feature_requester_class' => 'LaunchDarkly\\SomeKindOfFeatureRequester'\n// ]);",
      "language": "php"
    }
  ]
}
[/block]
If there are multiple instances of your application configured in this way with the same database, the same data gets written to the database multiple times, because each instance receives feature flags from LaunchDarkly. 

This is harmless, but it is inefficient, so you may want to use a persistent feature store without connecting to LaunchDarkly, as described below.
## Using a persistent feature store without connecting to LaunchDarkly
This is similar to the previous configuration, except that the SDK does not connect to LaunchDarkly at all. Instead, it relies on some other process which _does_ have a LaunchDarkly connection to write the latest flag data to the database, where the SDK will then read it.

The other process could be the LaunchDarkly Relay Proxy, or any other application that creates a SDK client with the same persistent store. To learn more about the Relay Proxy, read [The LaunchDarkly Relay Proxy](./the-relay-proxy).

Since the Relay Proxy is also known as the *L*aunch*D*arkly *D*aemon, the SDKs generally refer to this mode as "LDD mode." Creating the client is the same as described above, except that you must also specify LDD mode.
[block:code]
{
  "codes": [
    {
      "code": "import ld \"gopkg.in/launchdarkly/go-server-sdk.v4\"
store, err := examplepackage.NewExampleFeatureStore(storeOptions)\nconfig := ld.DefaultConfig\nconfig.FeatureStore = store\nconfig.UseLdd = true\nclient := ld.MakeCustomClient(sdkKey, config, waitTime)",
      "language": "go"
    },
    {
      "code": "import com.launchdarkly.client.*;
FeatureStoreFactory store = SomeKindOfFeatureStoreBuilder(storeOptions);\nConfig config = new Config.Builder()\n    .featureStoreFactory(store)\n    .useLdd(true)\n    .build();\nLDClient client = new LDClient(sdkKey, config);",
      "language": "java"
    },
    {
      "code": "using LaunchDarkly.Client;
var store = createSomeKindOfFeatureStore();\nvar config = Configuration.Default(sdkKey)\n    .WithFeatureStoreFactory(store)\n    .WithUseLdd(true);\nvar client = new LDClient(config);",
      "language": "csharp",
      "name": ".NET"
    },
    {
      "code": "require 'ldclient-rb'
store = SomeKindOfFeatureStore.new(storeOptions)\nconfig = LaunchDarkly::Config.new(\n  feature_store: store,\n  use_ldd: true\n)\nclient = LaunchDarkly::Client.new(sdk_key, config)",
      "language": "ruby"
    },
    {
      "code": "import ldclient\nfrom ldclient.config import Config
store = SomeKindOfFeatureStore(store_options)\nconfig = Config(feature_store=store, use_ldd=True)\nldclient.set_config(config)",
      "language": "python"
    },
    {
      "code": "const LaunchDarkly = require('ldclient-node');
const store = SomeKindOfFeatureStore(storeOptions);\nconst config = {\n  featureStore: store,\n  useLdd: true\n};\nconst client = LaunchDarkly.init(sdkKey, config);",
      "language": "javascript",
      "name": "Node.js"
    },
    {
      "code": "/*\n  In PHP, there is no difference between this and the previous example, because\n  the PHP SDK can only either get flags from LaunchDarkly *or* get them from a\n  database, not both\n*/\n$client = new LaunchDarkly\\LDClient(\"your_sdk_key\", [\n    'feature_requester' => LaunchDarkly\\Integrations\\Redis::featureRequester()\n]);
// Prior to version 3.5.0, use this syntax:\n// $client = new LaunchDarkly\\LDClient(\"your_sdk_key\", [\n//     'feature_requester_class' => 'LaunchDarkly\\SomeKindOfFeatureRequester'\n// ]);",
      "language": "php"
    }
  ]
}
[/block]

## Using Redis
All of the LaunchDarkly server-side SDKs support Redis. This feature is built into the main SDK distribution in all cases except .NET, where it requires a [separate package](https://github.com/launchdarkly/dotnet-server-sdk-redis).

The available options are slightly different in each language, but you can always specify the following:
* The Redis host address (defaults to `localhost:6379`)
* A prefix string to add to all keys used by the store, to avoid collisions in case the database is also being used for some other purpose
* The length of time that recently read or updated data should be cached in memory

In the following examples, the Redis feature store is set to use a host address of `my-redis:6379`, a prefix string of `"my-key-prefix"`, and a cache TTL of 30 seconds.
[block:code]
{
  "codes": [
    {
      "code": "import (\n    ld \"gopkg.in/launchdarkly/go-server-sdk.v4\"\n    ldredis \"gopkg.in/launchdarkly/go-server-sdk.v4/redis\"\n)
store, err := ldredis.NewRedisFeatureStoreWithDefaults(\n    ldredis.HostAndPort(\"my-redis\", 6379),\n    ldredis.Prefix(\"my-key-prefix\"),\n    ldredis.CacheTTL(30 * time.Second))
config := ld.DefaultConfig\nconfig.FeatureStore = store\nclient := ld.MakeCustomClient(sdkKey, config, waitTime)",
      "language": "go"
    },
    {
      "code": "import com.launchdarkly.client.*;
FeatureStoreFactory store =\n    Components.redisFeatureStore(URI.create(\"redis://my-redis:6379\"))\n        .prefix(\"my-key-prefix\")\n        .cacheTime(30, TimeUnit.SECONDS);
Config config = new Config.Builder()\n    .featureStoreFactory(store)\n    .build();\nLDClient client = new LDClient(sdkKey, config);",
      "language": "java"
    },
    {
      "code": "// Requires this package: https://github.com/launchdarkly/dotnet-server-sdk-redis
using LaunchDarkly.Client;\nusing LaunchDarkly.Client.Redis;
var store = RedisComponents.RedisFeatureStore()\n    .WithRedisHostAndPort(\"my-redis\", 6379)\n    .WithPrefix(\"my-key-prefix\")\n    .WithCacheExpiration(TimeSpan.FromSeconds(30));
var config = Configuration.Default(sdkKey)\n    .WithFeatureStoreFactory(store);\nvar client = new LDClient(config);",
      "language": "csharp",
      "name": ".NET"
    },
    {
      "code": "# Requires the additional gems 'redis' and 'connection_pool'
require 'ldclient-rb'
store = LaunchDarkly::Integrations::Redis.new_feature_store(\n  redis_url: 'redis://my-redis:6379',\n  prefix: 'my-key-prefix',\n  expiration: 30\n)
# Prior to version 5.5.0, use \"LaunchDarkly::RedisFeatureStore.new\" instead\n# of \"LaunchDarkly::Integrations::Redis.new_feature_store\"
config = LaunchDarkly::Config.new(\n  feature_store: store\n)\nclient = LaunchDarkly::Client.new(sdk_key, config)",
      "language": "ruby"
    },
    {
      "code": "import ldclient\nfrom ldclient.config import Config\nfrom ldclient.feature_store import CacheConfig\nfrom ldclient.integrations import Redis
store = Redis.new_feature_store(url='redis://my-redis:6379',\n    prefix='my-key-prefix', caching=CacheConfig(expiration=30))
# Prior to version 6.7.0, use this syntax:\n# store = RedisFeatureStore(url='redis://my-redis:6379', prefix='my-key-prefix',\n#     expiration=30)
config = Config(feature_store=store)\nldclient.set_config(config)",
      "language": "python"
    },
    {
      "code": "const LaunchDarkly = require('ldclient-node');
const redisOpts = {\n  url: 'redis://my-redis:6379'\n};\nconst store = LaunchDarkly.RedisFeatureStore(redisOpts, 30, 'my-key-prefix');
const config = {\n  featureStore: store\n};\nconst client = LaunchDarkly.init(sdkKey, config);",
      "language": "javascript",
      "name": "Node.js"
    },
    {
      "code": "/*\n  Note that there is no parameter for the cache TTL; the PHP SDK does not cache\n  data from Redis, since in PHP the entire in-memory application state is\n  normally discarded after each request.
  Also, you must install the package \"predis/predis\".\n*/\n$fr = LaunchDarkly\\Integrations\\Redis::featureRequester([\n    'redis_host' => 'my-redis',\n    'redis_port' => 6379,\n    'redis_prefix' => 'my-key-prefix'\n]);\n$client = new LaunchDarkly\\LDClient(\"your_sdk_key\", [\n    'feature_requester' => $fr\n]);
// Prior to version 3.5.0, use this syntax:\n// $client = new LaunchDarkly\\LDClient(\"your_sdk_key\", [\n//     'feature_requester_class' => 'LaunchDarkly\\LDDFeatureRequester',\n//     'redis_host' => 'my-redis',\n//     'redis_port' => 6379,\n//     'redis_prefix' => 'my-key-prefix'\n// ]);",
      "language": "php"
    }
  ]
}
[/block]

## Using DynamoDB
All of the current versions of the server-side SDKs support DynamoDB. DynamoDB is a particularly useful solution if you are running code in AWS Lambda, since it can be accessed from Lambda without needing access to any VPC resource.

In the Go SDK (as of version 4.5.1), the Ruby SDK (as of version 5.5.1), the Python SDK (as of version 6.7.0), and the PHP SDK (as of version 3.5.0), this feature is built into the main SDK distribution. The other SDKs require an additional package: [Java](https://github.com/launchdarkly/java-server-sdk-dynamodb), [.NET](https://github.com/launchdarkly/dotnet-server-sdk-dynamodb), [Node.js](https://github.com/launchdarkly/node-server-sdk-dynamodb).

In your application code, the only required parameter is the table name, although you can also specify any other options supported by AWS; by default, the DynamoDB driver will expect to get your AWS credentials and region from environment variables or local configuration files, as described in the AWS SDK documentation.

The table must already exist before your application starts. It must have a partition key called `"namespace"`, and a sort key called `"key"`. (The SDK does not create the table automatically because it would not know what values to use for other properties such as permissions and throughput.)

DynamoDB imposes a limit of 400KB on the total size of any database item. In this implementation, each feature flag or user segment is a single item, so the feature store will not be able to persist any flag or segment whose JSON representation is larger than that limit.

In the following examples, the DynamoDB feature store is set to use a table called `"my-table"` and a cache TTL of 30 seconds. The DynamoDB feature store does support using a key prefix, as shown in the Redis examples, but it is uncommon for one DynamoDB table to be shared by multiple applications.
[block:code]
{
  "codes": [
    {
      "code": "import (\n    ld \"gopkg.in/launchdarkly/go-server-sdk.v4\"\n    \"gopkg.in/launchdarkly/go-server-sdk.v4/lddynamodb\"\n)
store, err := ldredis.NewDynamoDBFeatureStore(\"my-table\",\n    lddynamodb.CacheTTL(30 * time.Second))
config := ld.DefaultConfig\nconfig.FeatureStore = store\nclient := ld.MakeCustomClient(sdkKey, config, waitTime)",
      "language": "go"
    },
    {
      "code": "// Requires this package: https://github.com/launchdarkly/java-server-sdk-dynamodb
import com.launchdarkly.client.*;\nimport com.launchdarkly.client.dynamodb.*;
FeatureStoreFactory store =\n    DynamoDbComponents.dynamoDbFeatureStore(\"my-table\")\n        .caching(FeatureStoreCacheConfig.enabled().withTtlSeconds(30));
Config config = new Config.Builder()\n    .featureStoreFactory(store)\n    .build();\nLDClient client = new LDClient(sdkKey, config);",
      "language": "java"
    },
    {
      "code": "// Requires this package: https://github.com/launchdarkly/dotnet-server-sdk-dynamodb
using LaunchDarkly.Client;\nusing LaunchDarkly.Client.DynamoDB;
var store = DynamoDBComponents.DynamoDBFeatureStore(\"my-table\")\n    .WithCaching(FeatureStoreCacheConfig.Enabled.WithTtlSeconds(30));
var config = Configuration.Default(sdkKey)\n    .WithFeatureStoreFactory(store);\nvar client = new LDClient(config);",
      "language": "csharp",
      "name": ".NET"
    },
    {
      "code": "# Requires the additional gem 'aws-sdk-dynamodb'
require 'ldclient-rb'
store = LaunchDarkly::Integrations::DynamoDB.new_feature_store('my-table',\n  { expiration: 30 })
config = LaunchDarkly::Config.new(\n  feature_store: store\n)\nclient = LaunchDarkly::Client.new(sdk_key, config)",
      "language": "ruby"
    },
    {
      "code": "# Requires the additional package 'boto3'
import ldclient\nfrom ldclient.config import Config\nfrom ldclient.feature_store import CacheConfig\nfrom ldclient.integrations import DynamoDB
store = DynamoDB.new_feature_store('my_table',\n    caching=CacheConfig(expiration=30))
config = Config(feature_store=store)\nldclient.set_config(config)",
      "language": "python"
    },
    {
      "code": "// Requires this package: https://github.com/launchdarkly/node-server-sdk-dynamodb
const LaunchDarkly = require('ldclient-node');\nconst DynamoDBFeatureStore = require('ldclient-node-dynamodb-store');
const store = DynamoDBFeatureStore('my-table', { cacheTTL: 30 });
const config = {\n  featureStore: store\n};\nconst client = LaunchDarkly.init(sdkKey, config);",
      "language": "javascript",
      "name": "Node.js"
    },
    {
      "code": "/*\n  Note that there is no parameter for the cache TTL; the PHP SDK does not cache\n  data from DynamoDB, since in PHP the entire in-memory application state is\n  normally discarded after each request.
  Also, you must install the package \"aws/aws-sdk-php\".\n*/\n$fr = LaunchDarkly\\Integrations\\DynamoDb::featureRequester([\n    'dynamodb_table' => 'my-table'\n]);\n$client = new LaunchDarkly\\LDClient(\"your_sdk_key\", [\n    'feature_requester' => $fr\n]);",
      "language": "php"
    }
  ]
}
[/block]

## Using Consul
All of the current versions of the server-side SDKs support Consul. In the Go SDK (as of version 4.5.0), the Ruby SDK (as of version 5.5.1), the Python SDK (as of version 6.8.1), and the PHP SDK (as of version 3.5.0), this feature is built into the main SDK distribution. The other SDKs require an additional package: [Java](https://github.com/launchdarkly/java-server-sdk-consul), [.NET](https://github.com/launchdarkly/dotnet-server-sdk-consul), [Node.js](https://github.com/launchdarkly/node-server-sdk-consul).

In the following examples, the Consul feature store is set to use a host address of `my-consul:8100`, a prefix string of `"my-key-prefix"`, and a cache TTL of 30 seconds.
[block:code]
{
  "codes": [
    {
      "code": "import (\n    ld \"gopkg.in/launchdarkly/go-server-sdk.v4\"\n    \"gopkg.in/launchdarkly/go-server-sdk.v4/ldconsul\"\n)
store, err := ldconsul.NewConsulFeatureStore(\n    ldconsul.Address(\"http://my-consul:8100\"),\n    ldconsul.Prefix(\"my-key-prefix\"),\n    ldconsul.CacheTTL(30 * time.Second))
config := ld.DefaultConfig\nconfig.FeatureStore = store\nclient := ld.MakeCustomClient(sdkKey, config, waitTime)",
      "language": "go"
    },
    {
      "code": "// Requires this package: https://github.com/launchdarkly/java-server-sdk-consul
import com.launchdarkly.client.*;\nimport com.launchdarkly.client.consul.*;
FeatureStoreFactory store =\n    ConsulComponents.consulFeatureStore()\n        .url(URL.create(\"http://my-consul:8100\"))\n        .prefix(\"my-key-prefix\")\n        .caching(FeatureStoreCacheConfig.enabled().withTtlSeconds(30));
Config config = new Config.Builder()\n    .featureStoreFactory(store)\n    .build();\nLDClient client = new LDClient(sdkKey, config);",
      "language": "java"
    },
    {
      "code": "// Requires this package: https://github.com/launchdarkly/dotnet-server-sdk-consul
using LaunchDarkly.Client;\nusing LaunchDarkly.Client.Consul;
var store = ConsulComponents.ConsulFeatureStore()\n    .WithAddress(new Uri(\"http://my-consul:8100\"))\n    .WithCaching(FeatureStoreCacheConfig.Enabled.WithTtlSeconds(30));
var config = Configuration.Default(sdkKey)\n    .WithFeatureStoreFactory(store);\nvar client = new LDClient(config);",
      "language": "csharp",
      "name": ".NET"
    },
    {
      "code": "# Requires the additional gem 'diplomat'
require 'ldclient-rb'
store = LaunchDarkly::Integrations::Consul.new_feature_store(\n  { url: 'http://my-consul:8100', prefix: 'my-key-prefix', expiration: 30 })
config = LaunchDarkly::Config.new(\n  feature_store: store\n)\nclient = LaunchDarkly::Client.new(sdk_key, config)",
      "language": "ruby"
    },
    {
      "code": "# Requires the additional package 'python-consul' - note that this is not\n# compatible with Python 3.3 or 3.4.
import ldclient\nfrom ldclient.config import Config\nfrom ldclient.feature_store import CacheConfig\nfrom ldclient.integrations import Consul
store = Consul.new_feature_store(host='my-consul', port=8100,\n    prefix='my-key-prefix', caching=CacheConfig(expiration=30))
config = Config(feature_store=store)\nldclient.set_config(config)",
      "language": "python"
    },
    {
      "code": "// Requires this package: https://github.com/launchdarkly/node-server-sdk-consul
const LaunchDarkly = require('ldclient-node');\nconst ConsulFeatureStore = require('ldclient-node-consul-store');
const store = ConsulFeatureStore({\n  consulOptions: {\n    host: 'my-consul',\n    port:  8100\n  },\n  prefix: 'my-key-prefix',\n  cacheTTL: 30\n});
const config = {\n  featureStore: store\n};\nconst client = LaunchDarkly.init(sdkKey, config);",
      "language": "javascript",
      "name": "Node.js"
    },
    {
      "code": "/*\n  Note that there is no parameter for the cache TTL; the PHP SDK does not cache\n  data from Consul, since in PHP the entire in-memory application state is\n  normally discarded after each request.
  Also, you must install the package \"sensiolabs/consul-php-sdk\".\n*/\n$fr = LaunchDarkly\\Integrations\\Consul::featureRequester([\n    'consul_uri' => 'http://my-consul:8100',\n    'consul_prefix' => 'my-key-prefix'\n]);\n$client = new LaunchDarkly\\LDClient(\"your_sdk_key\", [\n    'feature_requester' => $fr\n]);",
      "language": "php"
    }
  ]
}
[/block]