# Products API

The public cloud supports a products API through the admin console. Many of
these endpoints are undocumented and really require the UI to be user friendly.
In order to support different hardware/firmware versions, we have added a
subset of the products API which by default will create a single organization
that you can have multiple products under. We haven't implemented the
permissions system that comes with organizations so you can't rely on this to
handle account permissions.

## Using the API
In order to user this API, you will need to call the endpoints using an admin
access token.  We use this model because the admin account is the only account
which gets added to the organization. We currently haven't implemented any
organization endpoints which would allow you to add more users to the
organization. This adds a small amount of security in that you will only be
able to upload new firmware or edit products if you have the admin's access
token.

## Products Initial Setup
1. Grab the admin access token. This is logged to the console when the server
starts up.
2. Call the [Product Post Endpoint](#product-create) to create your first product.
3. Call the [Firmware Post Endpoint](#firmware-create) to add a new firmware.  You must set `current` to true in order to activate the firmware for your fleet.

## API

  ##### Product List
  Example cURL:
  ```
  curl -X GET \
    http://172.20.10.6:8080/v1/products/ \
    -H 'authorization: Bearer d2fafe627086dc56472aa0d8cc13ae9c20293371' \
    -H 'cache-control: no-cache'
  ```
  Sample Response:
  ```
  {
      "products": [
          {
              "description": "Test description",
              "hardware_version": "v1.0.1",
              "name": "Test Device 2",
              "platform_id": 6,
              "type": "Consumer",
              "organization": "rIoYeEmVmEzPPzgT",
              "slug": "test-device-2-v101",
              "created_at": "2017-07-21T01:33:23.875Z",
              "id": "7R04hBg30JAiDcVs",
              "config_id": "wLqfYW6Hf9MCYWEH"
          },
          {
              "description": "Test description",
              "hardware_version": "v1.0.0",
              "name": "Test Device",
              "platform_id": 6,
              "type": "Consumer",
              "organization": "rIoYeEmVmEzPPzgT",
              "slug": "test-device-v100",
              "created_at": "2017-07-21T01:33:02.555Z",
              "id": "sYhdTrUyIzywIyl3",
              "config_id": "qZ9AjcZbOtBDtAtA"
          }
      ]
  }
  ```
  ##### Product Get By ID or Slug
  Example cURL:
  ```
  curl -X GET \
    http://172.20.8.40:8080/v1/products/test-device-2-v101 \
    -H 'authorization: Bearer d2fafe627086dc56472aa0d8cc13ae9c20293371' \
    -H 'cache-control: no-cache' \
    -H 'content-type: application/json' \
  }'
  ```
  Sample Response:
  ```
  {
      "product": [
          {
              "description": "Test description",
              "hardware_version": "v1.0.1",
              "name": "Test Device 2",
              "platform_id": 6,
              "type": "Consumer",
              "organization": "rIoYeEmVmEzPPzgT",
              "slug": "test-device-2-v101",
              "created_at": "2017-07-21T01:33:23.875Z",
              "id": "7R04hBg30JAiDcVs",
              "config_id": "wLqfYW6Hf9MCYWEH"
          }
      ]
  }
  ```
  ##### Product Create
  `Platform IDs`:
  * 0 - Core
  * 6 - Photon
  * 8 - P1
  * 10 - Electron
  * 103- Bluz

  `Product Type`:
  * Consumer
  * Hobbyist
  * Industrial

  Example cURL:
  ```
  curl -X POST \
    http://172.20.8.40:8080/v1/products \
    -H 'authorization: Bearer d2fafe627086dc56472aa0d8cc13ae9c20293371' \
    -H 'cache-control: no-cache' \
    -H 'content-type: application/json' \
    -d '{
  	"product": {
  		"description": "Test description",
  		"hardware_version": "v1.0.0",
  		"name": "Test Device",
  		"platform_id": 6,
  		"type": "Consumer"
  	}
  }'
  ```
  Sample Response:
  ```
  {
      "product": [
          {
              "description": "Test description",
              "hardware_version": "v1.0.0",
              "name": "Test Device",
              "platform_id": 6,
              "type": "Consumer",
              "organization": "rIoYeEmVmEzPPzgT",
              "slug": "test-device-v100",
              "created_at": "2017-07-20T20:48:43.442Z",
              "id": 1,
              "config_id": "IxjRmTWEH1nsxxOz"
          }
      ]
  }
  ```  
  ##### Product Update
  Example cURL:
  ```
  curl -X PUT \
    http://172.20.8.40:8080/v1/products \
    -H 'authorization: Bearer d2fafe627086dc56472aa0d8cc13ae9c20293371' \
    -H 'cache-control: no-cache' \
    -H 'content-type: application/json' \
    -d '{
  	"product": {
          "description": "Test description",
          "hardware_version": "v1.0.1",
          "name": "Test Device 2",
          "platform_id": 6,
          "type": "Consumer",
          "organization": "rIoYeEmVmEzPPzgT",
          "slug": "test-device-2-v101",
          "created_at": "2017-07-21T01:33:23.875Z",
          "id": 1,
          "config_id": "wLqfYW6Hf9MCYWEH"
      }
  }'
  ```
  Sample Response:
  ```
  {
      "product": [
          {
              "description": "Test description",
              "hardware_version": "v1.0.1",
              "name": "Test Device 2",
              "platform_id": 6,
              "type": "Consumer",
              "organization": "rIoYeEmVmEzPPzgT",
              "slug": "test-device-2-v101",
              "created_at": "2017-07-21T01:33:23.875Z",
              "id": 1,
              "config_id": "wLqfYW6Hf9MCYWEH"
          }
      ]
  }
  ```
  ##### Product Delete
  Example cURL:
  ```
  curl -X DELETE \
    http://172.20.8.40:8080/v1/products/test-device-2-v101 \
    -H 'authorization: Bearer d2fafe627086dc56472aa0d8cc13ae9c20293371' \
    -H 'cache-control: no-cache' \
    -H 'content-type: application/json' \
  ```
  ##### Product Config Get
  Example cURL:
  ```
  curl -X GET \
    http://172.20.8.40:8080/v1/products/test-device-v100/config \
    -H 'authorization: Bearer d2fafe627086dc56472aa0d8cc13ae9c20293371' \
    -H 'cache-control: no-cache' \
    -H 'content-type: application/json' \
    -H 'postman-token: 325462d2-a6e3-4b6c-d7b7-cf0c7fe255ff'
  ```
  Sample Response:
  ```
  {
      "product_configuration": {
          "org_id": "rIoYeEmVmEzPPzgT",
          "product_id": "sYhdTrUyIzywIyl3",
          "id": "qZ9AjcZbOtBDtAtA"
      }
  }
  ```
  ##### Firmware List
  Example cURL:
  ```
  curl -X GET \
    http://172.20.8.40:8080/v1/products/test-device-v100/firmware/ \
    -H 'authorization: Bearer d2fafe627086dc56472aa0d8cc13ae9c20293371' \
    -H 'cache-control: no-cache' \
    -H 'content-type: application/json' \
  ```
  Sample Response:
  ```
  [
      {
          "current": "false",
          "description": "Test Description\n",
          "device_count": 0,
          "name": "photon_0.5.3_firmware_1500742294177.bin",
          "product_id": "1",
          "size": 36088,
          "title": "Test Title",
          "version": "2",
          "updated_at": "2017-07-22T16:55:48.705Z",
          "id": "SJVuRZQxBGyembNH"
      }
  ]
  ```
  ##### Firmware Get
  Example cURL:
  ```
  curl -X GET \
    http://172.20.8.40:8080/v1/products/test-device-v100/firmware/2 \
    -H 'authorization: Bearer d2fafe627086dc56472aa0d8cc13ae9c20293371' \
    -H 'cache-control: no-cache' \
    -H 'content-type: application/json' \
  ```
  Sample Response:
  ```
  {
      "current": "false",
      "description": "Test Description\n",
      "device_count": 0,
      "name": "photon_0.5.3_firmware_1500742294177.bin",
      "product_id": "1",
      "size": 36088,
      "title": "Test Title",
      "version": "2",
      "updated_at": "2017-07-22T16:55:48.705Z"
  }
  ```
  ##### Firmware Create
  Example cURL:
  ```
  curl -X POST \
    http://172.20.8.40:8080/v1/products/test-device-v100/firmware \
    -H 'authorization: Bearer d2fafe627086dc56472aa0d8cc13ae9c20293371' \
    -H 'cache-control: no-cache' \
    -H 'content-type: multipart/form-data; boundary=----WebKitFormBoundary7MA4YWxkTrZu0gW' \
    -F version=2 \
    -F current=false \
    -F 'binary=@C:\photon_tinker.bin' \
    -F 'title=Test Title' \
    -F 'description=Test Description
  '
  ```
  Sample Response:
  ```
  {
      "current": "false",
      "description": "Test Description\n",
      "device_count": 0,
      "name": "photon_tinker.bin",
      "product_id": 1,
      "size": 3952,
      "title": "Test Title",
      "updated_at": "2017-07-22T14:48:27.120Z",
      "version": "2",
  }
  ```
  ##### Firmware Update
  Example cURL:
  ```
  curl -X PUT \
    http://172.20.8.40:8080/v1/products/test-device-v100/firmware/2 \
    -H 'authorization: Bearer d2fafe627086dc56472aa0d8cc13ae9c20293371' \
    -H 'cache-control: no-cache' \
    -H 'content-type: application/json' \
    -d '{
      "current": "true",
      "description": "Test Description asdfasdfasdfas\n",
      "title": "Test Title"
  }'
  ```
  Sample Response:
  ```
  {
      "current": "true",
      "description": "Test Description asdfasdfasdfas\n",
      "device_count": 0,
      "name": "photon_0.5.3_firmware_1500742294177.bin",
      "product_id": "1",
      "size": 36088,
      "title": "Test Title",
      "version": "2",
      "updated_at": "2017-07-22T17:14:43.978Z"
  }
  ```
  ##### Firmware Delete
  Example cURL:
  ```
  curl -X DELETE \
    http://172.20.8.40:8080/v1/products/test-device-v100/firmware/2 \
    -H 'authorization: Bearer d2fafe627086dc56472aa0d8cc13ae9c20293371' \
    -H 'cache-control: no-cache' \
    -H 'content-type: application/json'
  ```