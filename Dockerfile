FROM 314904127601.dkr.ecr.us-west-2.amazonaws.com/nginx:1.14-alpine


COPY /nginx/nginx.conf /etc/nginx/nginx.conf
COPY entrypoint.sh /usr/bin/entrypoint.sh
COPY /nginx/apps.conf /nginx/kubeapps.conf /etc/nginx/sites-enabled/
COPY /nginx/maintenance.conf /etc/nginx/maintenance_conf/maintenance.conf
COPY /nginx/apps_edu_clients.conf /etc/nginx/apps.conf.d/apps_edu_clients.conf
COPY /repo/dist/ /var/www/edu-clients/

RUN chmod 700 /usr/bin/entrypoint.sh

ENTRYPOINT ["/usr/bin/entrypoint.sh"]
