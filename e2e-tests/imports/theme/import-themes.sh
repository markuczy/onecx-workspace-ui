echo "##### Importing themes"

for entry in "."/*.json
do
  #echo "$entry"
  file=$(basename "$entry")
  file=`echo $file | cut -d '.' -f 1`
  tenant=`echo $file | cut -d'_' -f1`
  theme=`echo $file | cut -d'_' -f2`
  token_var_name=${tenant}_token
  token=${!token_var_name}
  status_code=`curl --write-out %{http_code} --silent --output /dev/null -X POST -H "apm-principal-token: $token" -H 'Content-Type: application/json' "http://localhost:$PORT/exim/v1/themes/operator" -d @$entry`
  echo "Theme $theme were uploaded for tenant $tenant with status code $status_code"
done