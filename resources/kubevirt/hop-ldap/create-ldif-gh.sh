#!/bin/bash

while read NAME
do

echo "dn: uid=${NAME},ou=People,dc=hop,dc=2iij,dc=net"
echo "changetype: modify"
echo "replace: sshPublicKey"
echo "$(curl -s https://gh.iiji.jp/${NAME}.keys | while read SSHPUBLICKEY; do echo "sshPublicKey: ${SSHPUBLICKEY}"; done)"
echo ""

done
