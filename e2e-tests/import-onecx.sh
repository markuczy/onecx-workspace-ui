#!/bin/bash
## Define token
export onecx_token=$(curl -X POST "http://keycloak-app/realms/onecx/protocol/openid-connect/token" -H "Content-Type: application/x-www-form-urlencoded" -d "username=onecx" -d "password=onecx"  -d "grant_type=password" -d "client_id=onecx-shell-ui-client" | jq -r .access_token)

cd imports/tenant

echo " "
PORT=$TENANT_SVC_PORT bash ./import-tenants.sh

cd ../theme

echo " "
PORT=$THEME_SVC_PORT bash ./import-themes.sh

cd ../product-store

echo " "
PORT=$PRODUCT_STORE_SVC_PORT bash ./import-products.sh
echo " "
PORT=$PRODUCT_STORE_SVC_PORT bash ./import-slots.sh
echo " "
PORT=$PRODUCT_STORE_SVC_PORT bash ./import-microservices.sh
echo " "
PORT=$PRODUCT_STORE_SVC_PORT bash ./import-microfrontends.sh

cd ../permissions

echo " "
PORT=$PERMISSION_SVC_PORT bash ./import-permissions.sh

cd ../assignments

echo " "
PORT=$PERMISSION_SVC_PORT bash ./import-assignments.sh

cd ../workspace

echo " "
PORT=$WORKSPACE_SVC_PORT bash ./import-workspaces.sh

cd ../..
