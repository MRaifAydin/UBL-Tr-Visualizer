<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="2.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
	xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2"
	xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2"
	xmlns:n1="urn:oasis:names:specification:ubl:schema:xsd:CreditNote-2"
	xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
	exclude-result-prefixes="cac cbc n1 xsi">
	<xsl:output method="html" indent="yes" encoding="UTF-8"/>
	<xsl:template match="/">
		<html>
			<head>
				<title>Müstahsil Makbuzu</title>
			</head>
			<body>
				<h1>Müstahsil Makbuzu</h1>
				<p>Bu görsel şablon henüz hazırlanmamıştır. invoice.xslt / despatch.xslt referans alınarak doldurulacaktır.</p>
				<p>Belge No: <xsl:value-of select="//cbc:ID"/></p>
				<p>Düzenleme Tarihi: <xsl:value-of select="//cbc:IssueDate"/></p>
			</body>
		</html>
	</xsl:template>
</xsl:stylesheet>
