const parseRdapDomain = (rdapData) => {
    if (!rdapData) return "No RDAP data available";

    let result = "";

    // Basic domain information
    result += `Domain: ${rdapData.ldhName || rdapData.handle || "Unknown"}\n`;
    if (rdapData.handle) result += `Handle: ${rdapData.handle}\n`;
    if (rdapData.objectClassName) result += `Object Class: ${rdapData.objectClassName}\n`;

    // Status codes
    if (rdapData.status && rdapData.status.length > 0) {
        result += `Status: ${rdapData.status.join(", ")}\n`;
    }

    // Events
    if (rdapData.events && rdapData.events.length > 0) {
        result += `\nEvents:\n`;
        rdapData.events.forEach(event => {
            const date = new Date(event.eventDate).toLocaleString();
            result += `  ${event.eventAction}: ${date}\n`;
            if (event.eventActor) result += `    Actor: ${event.eventActor}\n`;
        });
    }

    // Nameservers
    if (rdapData.nameservers && rdapData.nameservers.length > 0) {
        result += `\nNameservers:\n`;
        rdapData.nameservers.forEach(ns => {
            result += `  - ${ns.ldhName}\n`;
            if (ns.ipAddresses) {
                if (ns.ipAddresses.v4) result += `    IPv4: ${ns.ipAddresses.v4.join(", ")}\n`;
                if (ns.ipAddresses.v6) result += `    IPv6: ${ns.ipAddresses.v6.join(", ")}\n`;
            }
            if (ns.handle) result += `    Handle: ${ns.handle}\n`;
            if (ns.status && ns.status.length > 0) result += `    Status: ${ns.status.join(", ")}\n`;
        });
    }

    // DNSSEC information
    if (rdapData.secureDNS) {
        result += `\nDNSSEC:\n`;
        result += `  Signed: ${rdapData.secureDNS.delegationSigned ? "Yes" : "No"}\n`;
        if (rdapData.secureDNS.dsData && rdapData.secureDNS.dsData.length > 0) {
            result += `  DS Data:\n`;
            rdapData.secureDNS.dsData.forEach(ds => {
                result += `    - Key Tag: ${ds.keyTag}, Algorithm: ${ds.algorithm}, Digest Type: ${ds.digestType}\n`;
                if (ds.digest) result += `      Digest: ${ds.digest}\n`;
            });
        }
    }

    // Public IDs
    if (rdapData.publicIds && rdapData.publicIds.length > 0) {
        result += `\nPublic IDs:\n`;
        rdapData.publicIds.forEach(id => {
            result += `  ${id.type}: ${id.identifier}\n`;
        });
    }

    // Entities
    if (rdapData.entities && rdapData.entities.length > 0) {
        result += `\nEntities:\n`;
        rdapData.entities.forEach(entity => {
            const roles = entity.roles ? `[${entity.roles.join(", ")}]` : "";
            result += `  ${roles}\n`;

            if (entity.handle) result += `    Handle: ${entity.handle}\n`;

            // Public IDs for entities
            if (entity.publicIds && entity.publicIds.length > 0) {
                entity.publicIds.forEach(id => {
                    result += `    ${id.type}: ${id.identifier}\n`;
                });
            }

            // VCard data
            if (entity.vcardArray && entity.vcardArray.length > 0) {
                const vcardProps = entity.vcardArray[1];

                vcardProps.forEach(prop => {
                    if (prop[0] === "fn") result += `    Name: ${prop[3]}\n`;
                    else if (prop[0] === "org") result += `    Organization: ${prop[3]}\n`;
                    else if (prop[0] === "adr") {
                        const address = Array.isArray(prop[3]) ? prop[3].join(", ") : prop[3];
                        const country = prop[1]?.cc ? ` (${prop[1].cc})` : "";
                        result += `    Address: ${address}${country}\n`;
                    } else if (prop[0] === "tel") {
                        const type = prop[1]?.type ? `(${prop[1].type})` : "";
                        result += `    Phone ${type}: ${prop[3].replace("tel:", "")}\n`;
                    } else if (prop[0] === "email") result += `    Email: ${prop[3]}\n`;
                    else if (prop[0] === "url") result += `    URL: ${prop[3]}\n`;
                });
            }

            // Remarks for entities
            if (entity.remarks && entity.remarks.length > 0) {
                entity.remarks.forEach(remark => {
                    result += `    Remarks: ${remark.title}\n`;
                    if (remark.description && remark.description.length > 0) {
                        remark.description.forEach(desc => {
                            result += `      ${desc}\n`;
                        });
                    }
                });
            }

            // Nested entities
            if (entity.entities && entity.entities.length > 0) {
                entity.entities.forEach(subEntity => {
                    const subRoles = subEntity.roles ? `[${subEntity.roles.join(", ")}]` : "";
                    result += `    - Sub-entity ${subRoles}\n`;

                    if (subEntity.vcardArray && subEntity.vcardArray.length > 0) {
                        const subVcardProps = subEntity.vcardArray[1];

                        subVcardProps.forEach(prop => {
                            if (prop[0] === "fn") result += `      Name: ${prop[3]}\n`;
                            else if (prop[0] === "email") result += `      Email: ${prop[3]}\n`;
                            else if (prop[0] === "tel") {
                                const type = prop[1]?.type ? `(${prop[1].type})` : "";
                                result += `      Phone ${type}: ${prop[3].replace("tel:", "")}\n`;
                            }
                        });
                    }
                });
            }
        });
    }

    // External links
    if (rdapData.links && rdapData.links.length > 0) {
        result += `\nLinks:\n`;
        rdapData.links.forEach(link => {
            result += `  - ${link.rel || "link"}: ${link.href}\n`;
            if (link.type) result += `    Type: ${link.type}\n`;
        });
    }

    // Notices and remarks
    const notices = [...(rdapData.notices || []), ...(rdapData.remarks || [])];
    if (notices.length > 0) {
        result += `\nNotices and Remarks:\n`;
        notices.forEach(notice => {
            if (notice.title) result += `  - ${notice.title}\n`;
            if (notice.description && notice.description.length > 0) {
                notice.description.forEach(desc => {
                    result += `    ${desc}\n`;
                });
            }
            if (notice.links && notice.links.length > 0) {
                notice.links.forEach(link => {
                    result += `    URL: ${link.href}\n`;
                });
            }
        });
    }

    // RDAP conformance
    if (rdapData.rdapConformance && rdapData.rdapConformance.length > 0) {
        result += `\nRDAP Conformance: ${rdapData.rdapConformance.join(", ")}\n`;
    }

    return result || JSON.stringify(rdapData, null, 2);
};