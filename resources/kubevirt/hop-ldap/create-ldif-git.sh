#!/bin/bash

while read NAME
do

echo "dn: uid=${NAME},ou=People,dc=hop,dc=2iij,dc=net"
echo "changetype: modify"
echo "replace: sshPublicKey"
echo "$(curl -s https://git.svc.2iij.net/${NAME}.keys | while read SSHPUBLICKEY || [ -n "${SSHPUBLICKEY}" ]; do echo "sshPublicKey: ${SSHPUBLICKEY}"; done)"
echo ""

done
