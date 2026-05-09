import type {
  FieldDefinition,
  FieldGroupConfig,
} from '../../types'
import { isFieldDefinition } from '../../types'
import {
  CURRENCY_OPTIONS,
  PACKAGING_TYPE_OPTIONS,
  QUANTITY_UNIT_OPTIONS,
  TRANSPORT_MODE_OPTIONS,
  WEIGHT_UNIT_OPTIONS,
  makeAddressGroup,
  makeAllowanceChargeGroup,
  makeDeliveryGroup,
  makeDocumentReferenceGroup,
  makePartyGroup,
} from '../shared/factories'
import requiredJson from './required.generated.json'

const REQUIRED_PATHS = new Set<string>(requiredJson.requiredPaths)

function isPathRequired(path: string[]): boolean {
  return REQUIRED_PATHS.has(path.join('/'))
}

function markRequiredInGroups(groups: FieldGroupConfig[]): void {
  for (const group of groups) {
    if (group.fields) {
      for (const field of group.fields) {
        if (isPathRequired(field.path)) field.required = true
      }
    }
    if (group.items) {
      for (const item of group.items) {
        if (isFieldDefinition(item)) {
          if (isPathRequired(item.path)) item.required = true
        } else {
          markRequiredInGroups([item])
        }
      }
    }
    if (group.subgroups) markRequiredInGroups(group.subgroups)
  }
}

export const rootTag = 'DespatchAdvice'

export const xsltPath = '/xslt/despatch.xslt'

export const rootAttributes: Record<string, string> = {
  'xmlns':       'urn:oasis:names:specification:ubl:schema:xsd:DespatchAdvice-2',
  'xmlns:cac':   'urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2',
  'xmlns:cbc':   'urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2',
  'xmlns:ext':   'urn:oasis:names:specification:ubl:schema:xsd:CommonExtensionComponents-2',
  'xmlns:ds':    'http://www.w3.org/2000/09/xmldsig#',
  'xmlns:xades': 'http://uri.etsi.org/01903/v1.3.2#',
  'xmlns:xsi':   'http://www.w3.org/2001/XMLSchema-instance',
  'xmlns:udt':   'urn:un:unece:uncefact:data:specification:UnqualifiedDataTypesSchemaModule:2',
  'xmlns:ccts':  'urn:un:unece:uncefact:documentation:2',
  'xmlns:qdt':   'urn:oasis:names:specification:ubl:schema:xsd:QualifiedDatatypes-2',
  'xmlns:ubltr': 'urn:oasis:names:specification:ubl:schema:xsd:TurkishCustomizationExtensionComponents',
}

export const rootStaticPrefix =
  '  <ext:UBLExtensions>\n' +
  '    <ext:UBLExtension><ext:ExtensionContent /></ext:UBLExtension>\n' +
  '  </ext:UBLExtensions>\n' +
  '  <cbc:UBLVersionID>2.1</cbc:UBLVersionID>\n' +
  '  <cbc:CustomizationID>TR1.2</cbc:CustomizationID>'

const PROFILE_OPTIONS = [
  { value: 'TEMELIRSALIYE', label: 'Temel İrsaliye' },
  { value: 'HKSIRSALIYE',   label: 'HKS İrsaliye (Hal Kayıt)' },
  { value: 'IDISIRSALIYE',  label: 'İDİS İrsaliye (İnşaat Demiri)' },
]

const DESPATCH_TYPE_OPTIONS = [
  { value: 'SEVK',     label: 'Sevk' },
  { value: 'MATBUDAN', label: 'Matbu' },
]

const ROOT = ['DespatchAdvice']

function makeOrderReferenceFields(prefix: string, base: string[]): FieldDefinition[] {
  return [
    { fieldId: `${prefix}-id`,             label: 'Sıra Numarası',     path: [...base, 'cbc:ID'],            attr: 'value' },
    { fieldId: `${prefix}-sales-order-id`, label: 'Sipariş Numarası',  path: [...base, 'cbc:SalesOrderID'],  attr: 'value' },
    { fieldId: `${prefix}-issue-date`,     label: 'Düzenleme Tarihi',  path: [...base, 'cbc:IssueDate'],     attr: 'value', type: 'date' },
    { fieldId: `${prefix}-order-type`,     label: 'Sipariş Tipi Kodu', path: [...base, 'cbc:OrderTypeCode'], attr: 'value' },
  ]
}

function makeShipmentGroup(prefix: string, base: string[]): FieldGroupConfig {
  return {
    title: 'Gönderi/Sevkiyat',
    fullWidth: true,
    wrap: true,
    fields: [
      { fieldId: `${prefix}-id`,                   label: 'Gönderi Numarası',              path: [...base, 'cbc:ID'],                                  attr: 'value' },
      { fieldId: `${prefix}-handling-code`,        label: 'İşlem Kodu',                    path: [...base, 'cbc:HandlingCode'],                        attr: 'value' },
      { fieldId: `${prefix}-handling-instr`,       label: 'Taşıma Talimatları',            path: [...base, 'cbc:HandlingInstructions'],                attr: 'value' },
      { fieldId: `${prefix}-gross-weight`,         label: 'Brüt Ağırlık',                  path: [...base, 'cbc:GrossWeightMeasure'],                  attr: 'value', type: 'duration-measure', attrKey: 'unitCode',   options: WEIGHT_UNIT_OPTIONS },
      { fieldId: `${prefix}-net-weight`,           label: 'Net Ağırlık',                   path: [...base, 'cbc:NetWeightMeasure'],                    attr: 'value', type: 'duration-measure', attrKey: 'unitCode',   options: WEIGHT_UNIT_OPTIONS },
      { fieldId: `${prefix}-gross-volume`,         label: 'Brüt Hacim',                    path: [...base, 'cbc:GrossVolumeMeasure'],                  attr: 'value', type: 'duration-measure', attrKey: 'unitCode',   options: [{ value: 'MTQ', label: 'Metreküp' }, { value: 'LTR', label: 'Litre' }] },
      { fieldId: `${prefix}-net-volume`,           label: 'Net Hacim',                     path: [...base, 'cbc:NetVolumeMeasure'],                    attr: 'value', type: 'duration-measure', attrKey: 'unitCode',   options: [{ value: 'MTQ', label: 'Metreküp' }, { value: 'LTR', label: 'Litre' }] },
      { fieldId: `${prefix}-total-goods-qty`,      label: 'Toplam Mal Sayısı',             path: [...base, 'cbc:TotalGoodsItemQuantity'],              attr: 'value', type: 'duration-measure', attrKey: 'unitCode',   options: QUANTITY_UNIT_OPTIONS },
      { fieldId: `${prefix}-total-thu-qty`,        label: 'Toplam Taşıma Birimi Sayısı',   path: [...base, 'cbc:TotalTransportHandlingUnitQuantity'],  attr: 'value', type: 'duration-measure', attrKey: 'unitCode',   options: QUANTITY_UNIT_OPTIONS },
      { fieldId: `${prefix}-insurance-value`,      label: 'Sigorta Tutarı',                path: [...base, 'cbc:InsuranceValueAmount'],                attr: 'value', type: 'duration-measure', attrKey: 'currencyID', options: CURRENCY_OPTIONS },
      { fieldId: `${prefix}-customs-value`,        label: 'Beyan Edilen Gümrük Tutarı',    path: [...base, 'cbc:DeclaredCustomsValueAmount'],          attr: 'value', type: 'duration-measure', attrKey: 'currencyID', options: CURRENCY_OPTIONS },
      { fieldId: `${prefix}-carriage-value`,       label: 'Beyan Edilen Taşıma Tutarı',    path: [...base, 'cbc:DeclaredForCarriageValueAmount'],      attr: 'value', type: 'duration-measure', attrKey: 'currencyID', options: CURRENCY_OPTIONS },
      { fieldId: `${prefix}-statistics-value`,     label: 'Beyan Edilen İstatistik Tutarı', path: [...base, 'cbc:DeclaredStatisticsValueAmount'],      attr: 'value', type: 'duration-measure', attrKey: 'currencyID', options: CURRENCY_OPTIONS },
      { fieldId: `${prefix}-fob`,                  label: 'FOB Tutarı',                    path: [...base, 'cbc:FreeOnBoardValueAmount'],              attr: 'value', type: 'duration-measure', attrKey: 'currencyID', options: CURRENCY_OPTIONS },
      { fieldId: `${prefix}-special-instr`,        label: 'Özel Talimatlar',               path: [...base, 'cbc:SpecialInstructions'],                 attr: 'value', type: 'notes-list' },
    ],
    subgroups: [
      makeAddressGroup(`${prefix}-return-addr`, [...base, 'cac:ReturnAddress']),
      {
        title: 'İlk Varış Limanı/Lokasyonu',
        wrap: true,
        fields: [
          { fieldId: `${prefix}-first-arr-id`,   label: 'ID',   path: [...base, 'cac:FirstArrivalPortLocation', 'cbc:ID'],   attr: 'value' },
          { fieldId: `${prefix}-first-arr-name`, label: 'Adı', path: [...base, 'cac:FirstArrivalPortLocation', 'cbc:Name'], attr: 'value' },
        ],
        subgroups: [
          makeAddressGroup(`${prefix}-first-arr-addr`, [...base, 'cac:FirstArrivalPortLocation', 'cac:Address']),
        ],
      },
      {
        title: 'Son Çıkış Limanı/Lokasyonu',
        wrap: true,
        fields: [
          { fieldId: `${prefix}-last-exit-id`,   label: 'ID',   path: [...base, 'cac:LastExitPortLocation', 'cbc:ID'],   attr: 'value' },
          { fieldId: `${prefix}-last-exit-name`, label: 'Adı', path: [...base, 'cac:LastExitPortLocation', 'cbc:Name'], attr: 'value' },
        ],
        subgroups: [
          makeAddressGroup(`${prefix}-last-exit-addr`, [...base, 'cac:LastExitPortLocation', 'cac:Address']),
        ],
      },
    ],
  }
}

function makeShipmentStageGroup(prefix: string, base: string[]): FieldGroupConfig {
  return {
    title: 'Taşıma Evresi',
    fullWidth: true,
    wrap: true,
    repeatable: true,
    instanceMarker: 'cac:ShipmentStage',
    addLabel: 'Yeni Taşıma Evresi Ekle',
    fields: [
      { fieldId: `${prefix}-id`,             label: 'Sıra Numarası',         path: [...base, 'cbc:ID'],                    attr: 'value' },
      { fieldId: `${prefix}-mode`,           label: 'Taşıma Şekli',          path: [...base, 'cbc:TransportModeCode'],     attr: 'value', type: 'select', options: TRANSPORT_MODE_OPTIONS },
      { fieldId: `${prefix}-means-type`,     label: 'Taşıma Aracı Tipi',     path: [...base, 'cbc:TransportMeansTypeCode'], attr: 'value' },
      { fieldId: `${prefix}-direction`,      label: 'Yön Kodu',              path: [...base, 'cbc:TransitDirectionCode'],  attr: 'value' },
      { fieldId: `${prefix}-instructions`,   label: 'Talimatlar',            path: [...base, 'cbc:Instructions'],          attr: 'value', type: 'notes-list' },
    ],
    subgroups: [
      {
        title: 'Geçiş Dönemi',
        wrap: true,
        fields: [
          { fieldId: `${prefix}-transit-start-date`, label: 'Başlangıç Tarihi', path: [...base, 'cac:TransitPeriod', 'cbc:StartDate'], attr: 'value', type: 'date' },
          { fieldId: `${prefix}-transit-start-time`, label: 'Başlangıç Saati',  path: [...base, 'cac:TransitPeriod', 'cbc:StartTime'], attr: 'value', type: 'time' },
          { fieldId: `${prefix}-transit-end-date`,   label: 'Bitiş Tarihi',     path: [...base, 'cac:TransitPeriod', 'cbc:EndDate'],   attr: 'value', type: 'date' },
          { fieldId: `${prefix}-transit-end-time`,   label: 'Bitiş Saati',      path: [...base, 'cac:TransitPeriod', 'cbc:EndTime'],   attr: 'value', type: 'time' },
        ],
      },
      {
        title: 'Taşıma Aracı',
        wrap: true,
        fields: [
          { fieldId: `${prefix}-tm-journey-id`,   label: 'Sefer Numarası',       path: [...base, 'cac:TransportMeans', 'cbc:JourneyID'],                attr: 'value' },
          { fieldId: `${prefix}-tm-nat-id`,       label: 'Tescil Ülke Kodu',     path: [...base, 'cac:TransportMeans', 'cbc:RegistrationNationalityID'], attr: 'value' },
          { fieldId: `${prefix}-tm-direction`,    label: 'Yön Kodu',             path: [...base, 'cac:TransportMeans', 'cbc:DirectionCode'],            attr: 'value' },
          { fieldId: `${prefix}-tm-means-type`,   label: 'Taşıma Aracı Tipi',    path: [...base, 'cac:TransportMeans', 'cbc:TransportMeansTypeCode'],   attr: 'value' },
          { fieldId: `${prefix}-tm-trade-svc`,    label: 'Ticari Servis Kodu',   path: [...base, 'cac:TransportMeans', 'cbc:TradeServiceCode'],         attr: 'value' },
        ],
        subgroups: [
          {
            title: 'Karayolu Taşıması',
            wrap: true,
            fields: [
              { fieldId: `${prefix}-road-plate`, label: 'Plaka', path: [...base, 'cac:TransportMeans', 'cac:RoadTransport', 'cbc:LicensePlateID'], attr: 'value', type: 'duration-measure', attrKey: 'schemeID', options: [{ value: 'CEKICI', label: 'Çekici' }, { value: 'DORSE', label: 'Dorse' }, { value: 'TASIYICI', label: 'Taşıyıcı' }] },
            ],
          },
          {
            title: 'Demiryolu Taşıması',
            wrap: true,
            fields: [
              { fieldId: `${prefix}-rail-train-id`, label: 'Tren Numarası', path: [...base, 'cac:TransportMeans', 'cac:RailTransport', 'cbc:TrainID'],   attr: 'value' },
              { fieldId: `${prefix}-rail-car-id`,   label: 'Vagon Numarası', path: [...base, 'cac:TransportMeans', 'cac:RailTransport', 'cbc:RailCarID'], attr: 'value' },
            ],
          },
          {
            title: 'Denizyolu Taşıması',
            wrap: true,
            fields: [
              { fieldId: `${prefix}-mar-vessel-id`,   label: 'Gemi Numarası', path: [...base, 'cac:TransportMeans', 'cac:MaritimeTransport', 'cbc:VesselID'],   attr: 'value' },
              { fieldId: `${prefix}-mar-vessel-name`, label: 'Gemi Adı',      path: [...base, 'cac:TransportMeans', 'cac:MaritimeTransport', 'cbc:VesselName'], attr: 'value' },
            ],
          },
          {
            title: 'Havayolu Taşıması',
            wrap: true,
            fields: [
              { fieldId: `${prefix}-air-aircraft-id`, label: 'Uçak Numarası', path: [...base, 'cac:TransportMeans', 'cac:AirTransport', 'cbc:AircraftID'], attr: 'value' },
            ],
          },
          makePartyGroup('Araç Sahibi', `${prefix}-tm-owner`, [...base, 'cac:TransportMeans', 'cac:OwnerParty']),
        ],
      },
      {
        title: 'Sürücü',
        wrap: true,
        repeatable: true,
        instanceMarker: 'cac:DriverPerson',
        addLabel: 'Yeni Sürücü Ekle',
        fields: [
          { fieldId: `${prefix}-driver-first`,  label: 'Ad',         path: [...base, 'cac:DriverPerson', 'cbc:FirstName'],     attr: 'value' },
          { fieldId: `${prefix}-driver-family`, label: 'Soyad',      path: [...base, 'cac:DriverPerson', 'cbc:FamilyName'],    attr: 'value' },
          { fieldId: `${prefix}-driver-title`,  label: 'Ünvan',      path: [...base, 'cac:DriverPerson', 'cbc:Title'],         attr: 'value' },
          { fieldId: `${prefix}-driver-middle`, label: 'Diğer Adı',  path: [...base, 'cac:DriverPerson', 'cbc:MiddleName'],    attr: 'value' },
          { fieldId: `${prefix}-driver-suffix`, label: 'Ad Ön Eki',  path: [...base, 'cac:DriverPerson', 'cbc:NameSuffix'],    attr: 'value' },
          { fieldId: `${prefix}-driver-tckn`,   label: 'TCKN',       path: [...base, 'cac:DriverPerson', 'cbc:NationalityID'], attr: 'value' },
        ],
      },
    ],
  }
}

function makeTransportHandlingUnitGroup(prefix: string, base: string[]): FieldGroupConfig {
  return {
    title: 'Taşıma Birimi',
    fullWidth: true,
    wrap: true,
    repeatable: true,
    instanceMarker: 'cac:TransportHandlingUnit',
    addLabel: 'Yeni Taşıma Birimi Ekle',
    fields: [
      { fieldId: `${prefix}-id`,                 label: 'Sıra Numarası',          path: [...base, 'cbc:ID'],                                attr: 'value' },
      { fieldId: `${prefix}-type-code`,          label: 'Taşıma Birimi Tipi',    path: [...base, 'cbc:TransportHandlingUnitTypeCode'],     attr: 'value' },
      { fieldId: `${prefix}-handling-code`,      label: 'İşlem Kodu',             path: [...base, 'cbc:HandlingCode'],                      attr: 'value' },
      { fieldId: `${prefix}-handling-instr`,     label: 'Taşıma Talimatları',     path: [...base, 'cbc:HandlingInstructions'],              attr: 'value' },
      { fieldId: `${prefix}-hazardous`,          label: 'Tehlikeli Madde mi?',    path: [...base, 'cbc:HazardousRiskIndicator'],            attr: 'value', type: 'select', options: [{ value: 'true', label: 'Evet' }, { value: 'false', label: 'Hayır' }] },
      { fieldId: `${prefix}-total-goods-qty`,    label: 'Toplam Mal Sayısı',      path: [...base, 'cbc:TotalGoodsItemQuantity'],            attr: 'value', type: 'duration-measure', attrKey: 'unitCode', options: QUANTITY_UNIT_OPTIONS },
      { fieldId: `${prefix}-total-package-qty`,  label: 'Toplam Paket Sayısı',    path: [...base, 'cbc:TotalPackageQuantity'],              attr: 'value', type: 'number' },
      { fieldId: `${prefix}-damage-remarks`,     label: 'Hasar Notları',          path: [...base, 'cbc:DamageRemarks'],                     attr: 'value', type: 'notes-list' },
      { fieldId: `${prefix}-trace-id`,           label: 'İzleme Numarası',        path: [...base, 'cbc:TraceID'],                           attr: 'value' },
    ],
    subgroups: [
      {
        title: 'Paket',
        wrap: true,
        repeatable: true,
        instanceMarker: 'cac:ActualPackage',
        addLabel: 'Yeni Paket Ekle',
        fields: [
          { fieldId: `${prefix}-pkg-id`,        label: 'Kap Numarası',     path: [...base, 'cac:ActualPackage', 'cbc:ID'],                          attr: 'value' },
          { fieldId: `${prefix}-pkg-qty`,       label: 'Kap Adedi',        path: [...base, 'cac:ActualPackage', 'cbc:Quantity'],                    attr: 'value', type: 'number' },
          { fieldId: `${prefix}-pkg-returnable`, label: 'İade Edilir mi?', path: [...base, 'cac:ActualPackage', 'cbc:ReturnableMaterialIndicator'], attr: 'value', type: 'select', options: [{ value: 'true', label: 'Evet' }, { value: 'false', label: 'Hayır' }] },
          { fieldId: `${prefix}-pkg-type`,      label: 'Paket/Kap Cinsi',  path: [...base, 'cac:ActualPackage', 'cbc:PackagingTypeCode'],           attr: 'value', type: 'select', options: PACKAGING_TYPE_OPTIONS },
          { fieldId: `${prefix}-pkg-material`,  label: 'Paket Malzemesi',  path: [...base, 'cac:ActualPackage', 'cbc:PackingMaterial'],             attr: 'value' },
        ],
      },
      {
        title: 'Sıcaklık',
        wrap: true,
        fields: [
          { fieldId: `${prefix}-temp-min`, label: 'Minimum Sıcaklık', path: [...base, 'cac:MinimumTemperature', 'cbc:Value'], attr: 'value', type: 'number' },
          { fieldId: `${prefix}-temp-max`, label: 'Maksimum Sıcaklık', path: [...base, 'cac:MaximumTemperature', 'cbc:Value'], attr: 'value', type: 'number' },
        ],
      },
    ],
  }
}

function makeItemGroup(prefix: string, base: string[]): FieldGroupConfig {
  return {
    title: 'Mal/Hizmet',
    wrap: true,
    fields: [
      { fieldId: `${prefix}-name`,        label: 'İsim',            path: [...base, 'cbc:Name'],        attr: 'value' },
      { fieldId: `${prefix}-description`, label: 'Açıklama',        path: [...base, 'cbc:Description'], attr: 'value' },
      { fieldId: `${prefix}-keyword`,     label: 'Anahtar Kelime',  path: [...base, 'cbc:Keyword'],     attr: 'value' },
      { fieldId: `${prefix}-brand`,       label: 'Marka',           path: [...base, 'cbc:BrandName'],   attr: 'value' },
      { fieldId: `${prefix}-model`,       label: 'Model',           path: [...base, 'cbc:ModelName'],   attr: 'value' },
    ],
    subgroups: [
      {
        title: 'Alıcı Mal/Hizmet Kimliği',
        wrap: true,
        fields: [
          { fieldId: `${prefix}-buyer-id`, label: 'ID', path: [...base, 'cac:BuyersItemIdentification', 'cbc:ID'], attr: 'value' },
        ],
      },
      {
        title: 'Satıcı Mal/Hizmet Kimliği',
        wrap: true,
        fields: [
          { fieldId: `${prefix}-seller-id`, label: 'ID', path: [...base, 'cac:SellersItemIdentification', 'cbc:ID'], attr: 'value' },
        ],
      },
      {
        title: 'Üretici Mal/Hizmet Kimliği',
        wrap: true,
        fields: [
          { fieldId: `${prefix}-mfg-id`, label: 'ID', path: [...base, 'cac:ManufacturersItemIdentification', 'cbc:ID'], attr: 'value' },
        ],
      },
      {
        title: 'Ek Mal/Hizmet Kimliği',
        wrap: true,
        repeatable: true,
        instanceMarker: 'cac:AdditionalItemIdentification',
        addLabel: 'Yeni Ek Kimlik Ekle',
        fields: [
          { fieldId: `${prefix}-add-id`, label: 'ID', path: [...base, 'cac:AdditionalItemIdentification', 'cbc:ID'], attr: 'value', type: 'duration-measure', attrKey: 'schemeID', options: [{ value: 'KUNYENO', label: 'Künye No (HKS)' }, { value: 'ETIKETNO', label: 'Etiket No (İDİS)' }, { value: 'GTIP', label: 'GTİP' }] },
        ],
      },
      {
        title: 'Menşei Ülke',
        wrap: true,
        fields: [
          { fieldId: `${prefix}-origin-name`, label: 'Ülke Adı', path: [...base, 'cac:OriginCountry', 'cbc:Name'], attr: 'value' },
        ],
      },
      {
        title: 'Mal/Hizmet Sınıflandırması',
        wrap: true,
        repeatable: true,
        instanceMarker: 'cac:CommodityClassification',
        addLabel: 'Yeni Sınıflandırma Ekle',
        fields: [
          { fieldId: `${prefix}-cc-code`, label: 'Sınıflandırma Kodu', path: [...base, 'cac:CommodityClassification', 'cbc:ItemClassificationCode'], attr: 'value' },
        ],
      },
    ],
  }
}

function makeDespatchLineGroup(prefix: string, base: string[]): FieldGroupConfig {
  return {
    title: 'İrsaliye Satırı',
    fullWidth: true,
    wrap: true,
    repeatable: true,
    instanceMarker: 'cac:DespatchLine',
    addLabel: 'Yeni İrsaliye Satırı Ekle',
    fields: [
      { fieldId: `${prefix}-id`,             label: 'Sıra Numarası',         path: [...base, 'cbc:ID'],                  attr: 'value' },
      { fieldId: `${prefix}-note`,           label: 'Notlar',                path: [...base, 'cbc:Note'],                attr: 'value', type: 'notes-list' },
      { fieldId: `${prefix}-delivered-qty`,  label: 'Teslim Edilen Miktar',  path: [...base, 'cbc:DeliveredQuantity'],   attr: 'value', type: 'duration-measure', attrKey: 'unitCode', options: QUANTITY_UNIT_OPTIONS },
      { fieldId: `${prefix}-outstanding-qty`, label: 'Eksik Miktar',          path: [...base, 'cbc:OutstandingQuantity'], attr: 'value', type: 'duration-measure', attrKey: 'unitCode', options: QUANTITY_UNIT_OPTIONS },
      { fieldId: `${prefix}-outstanding-rsn`, label: 'Eksiklik Nedeni',       path: [...base, 'cbc:OutstandingReason'],   attr: 'value', type: 'notes-list' },
      { fieldId: `${prefix}-oversupply-qty`, label: 'Fazla Gönderim Miktarı', path: [...base, 'cbc:OversupplyQuantity'],  attr: 'value', type: 'duration-measure', attrKey: 'unitCode', options: QUANTITY_UNIT_OPTIONS },
    ],
    subgroups: [
      {
        title: 'Sipariş Satırı Referansı',
        wrap: true,
        fields: [
          { fieldId: `${prefix}-olr-line-id`,       label: 'Sipariş Satır Numarası', path: [...base, 'cac:OrderLineReference', 'cbc:LineID'],                       attr: 'value' },
          { fieldId: `${prefix}-olr-sales-line-id`, label: 'Satış Sipariş Satır No', path: [...base, 'cac:OrderLineReference', 'cbc:SalesOrderLineID'],             attr: 'value' },
          { fieldId: `${prefix}-olr-uuid`,          label: 'UUID',                   path: [...base, 'cac:OrderLineReference', 'cbc:UUID'],                         attr: 'value' },
          { fieldId: `${prefix}-olr-status`,        label: 'Satır Durumu',           path: [...base, 'cac:OrderLineReference', 'cbc:LineStatusCode'],               attr: 'value' },
          { fieldId: `${prefix}-olr-or-id`,         label: 'Sipariş Numarası',       path: [...base, 'cac:OrderLineReference', 'cac:OrderReference', 'cbc:ID'],     attr: 'value' },
          { fieldId: `${prefix}-olr-or-issue`,      label: 'Sipariş Tarihi',         path: [...base, 'cac:OrderLineReference', 'cac:OrderReference', 'cbc:IssueDate'], attr: 'value', type: 'date' },
        ],
      },
      makeDocumentReferenceGroup('Belge Referansı', `${prefix}-doc-ref`, [...base, 'cac:DocumentReference']),
      makeItemGroup(`${prefix}-item`, [...base, 'cac:Item']),
      {
        title: 'Satır Gönderi Bilgisi',
        wrap: true,
        fields: [
          { fieldId: `${prefix}-line-shipment-id`,    label: 'Gönderi Numarası', path: [...base, 'cac:Shipment', 'cbc:ID'],                  attr: 'value' },
          { fieldId: `${prefix}-line-shipment-gross`, label: 'Brüt Ağırlık',     path: [...base, 'cac:Shipment', 'cbc:GrossWeightMeasure'],   attr: 'value', type: 'duration-measure', attrKey: 'unitCode', options: WEIGHT_UNIT_OPTIONS },
        ],
      },
    ],
  }
}

export const fieldGroups: FieldGroupConfig[] = [
  {
    title: 'UBL Eklentileri',
    fullWidth: true,
    wrap: true,
    fields: [
      {
        fieldId: 'desp-ubl-extensions-info',
        label: 'ext:UBLExtensions',
        path: [],
        attr: 'value',
        disabled: true,
      },
    ],
  },
  {
    title: 'Belge Genel Bilgileri',
    wide: true,
    fullWidth: true,
    wrap: true,
    defaultOpen: true,
    fields: [
      { fieldId: 'desp-profile-id',     label: 'Senaryo',             path: [...ROOT, 'cbc:ProfileID'],              attr: 'value', type: 'select', options: PROFILE_OPTIONS },
      { fieldId: 'desp-id',             label: 'İrsaliye No',         path: [...ROOT, 'cbc:ID'],                     attr: 'value' },
      { fieldId: 'desp-copy-indicator', label: 'Kopya/Asıl',          path: [...ROOT, 'cbc:CopyIndicator'],          attr: 'value', type: 'select', options: [{ value: 'false', label: 'Asıl' }, { value: 'true', label: 'Kopya' }] },
      { fieldId: 'desp-uuid',           label: 'Ettn',                path: [...ROOT, 'cbc:UUID'],                   attr: 'value' },
      { fieldId: 'desp-issue-date',     label: 'Düzenleme Tarihi',    path: [...ROOT, 'cbc:IssueDate'],              attr: 'value', type: 'date' },
      { fieldId: 'desp-issue-time',     label: 'Düzenleme Saati',     path: [...ROOT, 'cbc:IssueTime'],              attr: 'value', type: 'time' },
      { fieldId: 'desp-type-code',      label: 'İrsaliye Tipi',       path: [...ROOT, 'cbc:DespatchAdviceTypeCode'], attr: 'value', type: 'select', options: DESPATCH_TYPE_OPTIONS },
      { fieldId: 'desp-notes',          label: 'Notlar',              path: [...ROOT, 'cbc:Note'],                   attr: 'value', type: 'notes-list' },
      { fieldId: 'desp-line-count',     label: 'Satır Sayısı',        path: [...ROOT, 'cbc:LineCountNumeric'],       attr: 'value', type: 'number' },
    ],
  },
  {
    title: 'Sipariş Bilgileri',
    fullWidth: true,
    wrap: true,
    repeatable: true,
    instanceMarker: 'cac:OrderReference',
    addLabel: 'Yeni Sipariş Bilgisi Ekle',
    fields: makeOrderReferenceFields('desp-order-ref', [...ROOT, 'cac:OrderReference']),
  },
  {
    ...makeDocumentReferenceGroup('Diğer Belge Referansları', 'desp-add-doc-ref', [...ROOT, 'cac:AdditionalDocumentReference']),
    fullWidth: true,
    repeatable: true,
    instanceMarker: 'cac:AdditionalDocumentReference',
    addLabel: 'Yeni Belge Referansı Ekle',
  },
  { ...makePartyGroup('Gönderen (Satıcı)', 'desp-supplier', [...ROOT, 'cac:DespatchSupplierParty', 'cac:Party']), fullWidth: true },
  { ...makePartyGroup('Alıcı', 'desp-customer', [...ROOT, 'cac:DeliveryCustomerParty', 'cac:Party']), fullWidth: true },
  { ...makePartyGroup('Asıl Alıcı (Müşteri)', 'desp-buyer', [...ROOT, 'cac:BuyerCustomerParty', 'cac:Party']), fullWidth: true },
  { ...makePartyGroup('Asıl Satıcı', 'desp-seller', [...ROOT, 'cac:SellerSupplierParty', 'cac:Party']), fullWidth: true },
  { ...makePartyGroup('Sevk Eden Müşteri', 'desp-originator', [...ROOT, 'cac:OriginatorCustomerParty', 'cac:Party']), fullWidth: true },
  makeShipmentGroup('desp-shipment', [...ROOT, 'cac:Shipment']),
  makeShipmentStageGroup('desp-stage', [...ROOT, 'cac:Shipment', 'cac:ShipmentStage']),
  makeTransportHandlingUnitGroup('desp-thu', [...ROOT, 'cac:Shipment', 'cac:TransportHandlingUnit']),
  { ...makeDeliveryGroup('Teslimat', 'desp-delivery', [...ROOT, 'cac:Shipment', 'cac:Delivery']), fullWidth: true },
  { ...makeAllowanceChargeGroup('desp-shipment-charge', [...ROOT, 'cac:Shipment', 'cac:FreightAllowanceCharge']), fullWidth: true },
  makeDespatchLineGroup('desp-line', [...ROOT, 'cac:DespatchLine']),
]

function collectFields(groups: FieldGroupConfig[]): FieldDefinition[] {
  return groups.flatMap((g) => {
    if (g.repeatable) return []
    if (g.items) {
      const fields = g.items.filter(isFieldDefinition)
      const subs = g.items.filter((i): i is FieldGroupConfig => !isFieldDefinition(i))
      return [...fields, ...collectFields(subs)]
    }
    return [
      ...(g.fields ?? []),
      ...(g.subgroups ? collectFields(g.subgroups) : []),
    ]
  })
}

markRequiredInGroups(fieldGroups)

export const fieldDefinitions: FieldDefinition[] = collectFields(fieldGroups)
