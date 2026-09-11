export interface CompanyDetails {
  name: string;
  addressLine1: string;
  village: string;
  taluka: string;
  district: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
  countryCode: string;
  phone: string;
  fax: string;
  email: string;
  website: string;
  gstin: string;
  cin: string;
  certifications: string;
  fullAddress: string;
}

export const COMPANY_INFO: CompanyDetails = {
  name: 'KSPG Automotive India Private Ltd.',
  addressLine1: 'Gat No. 380, Village Takwe, Budruk Taluka, Maval Dist',
  village: 'Takwe',
  taluka: 'Budruk Taluka',
  district: 'Maval Dist',
  city: 'Pune',
  state: 'Maharashtra',
  pincode: '412106',
  country: 'India',
  countryCode: 'country_in',
  phone: '+91 (0)2114-307-0',
  fax: '+91 2114 307510',
  email: 'logistics.india@kspg-ag.com',
  website: 'www.kspg.com',
  gstin: '27AAACK1945M1ZN',
  cin: 'U34300PN2006PTC128450',
  certifications: 'IATF 16949:2016 / ISO 9001 / ISO 14001 Certified Plant',
  fullAddress: 'Gat No. 380, Village Takwe, Budruk Taluka, Maval Dist, Pune, Maharashtra 412106, India'
};
