openssl req -new -out presencek8s.com.csr -newkey rsa:2048 -nodes -sha256 -keyout presencek8s.com.key.temp -config csr.conf
rm presencek8s.com.key.temp