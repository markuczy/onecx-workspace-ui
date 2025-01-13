echo "##### Importing permissions"

for entry in "."/*.json
do
  #echo "$entry"
  file=$(basename "$entry")
  file=`echo $file | cut -d '.' -f 1`
  product=${file%%_*}
  appid=`echo $file | cut -d'_' -f2`
  status_code=`curl --write-out %{http_code} --silent --output /dev/null -X PUT -H 'Content-Type: application/json' "http://localhost:$PORT/operator/v1/$product/$appid" -d @$entry`
  echo "Permissions for app $appid and product $product was uploaded with result $status_code"
done