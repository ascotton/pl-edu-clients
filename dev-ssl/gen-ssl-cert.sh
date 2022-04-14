########################
# Create CA-signed cert
########################

NAME=presencek8s.com # Use your own domain name
# Generate a private key
openssl genrsa -out pl-dev-cert.key 2048
# Create a certificate-signing request
openssl req -new -key pl-dev-ssl.key -out $NAME.csr
# Create a config file for the extensions
>$NAME.ext cat <<-EOF
authorityKeyIdentifier=keyid,issuer
basicConstraints=CA:FALSE
keyUsage = digitalSignature, nonRepudiation, keyEncipherment, dataEncipherment
subjectAltName = @alt_names
[alt_names]
DNS.1 = $NAME # Be sure to include the domain name here because Common Name is not so commonly honoured by itself
DNS.2 = dev.$NAME # Optionally, add additional domains (I've added a subdomain here)
EOF
# Create the signed certificate
openssl x509 -req -in $NAME.csr -CA pl-dev-CA.pem -CAkey pl-dev-CA.key -CAcreateserial \
-out pl-dev-ssl.crt -days 825 -sha256 -extfile $NAME.ext
