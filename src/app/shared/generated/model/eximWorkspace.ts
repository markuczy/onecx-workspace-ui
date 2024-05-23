/**
 * onecx-workspace-bff
 * OneCX Workspace BFF
 *
 * The version of the OpenAPI document: 1.0
 * 
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 */
import { MenuSnapshot } from './menuSnapshot';
import { EximProduct } from './eximProduct';
import { EximSlot } from './eximSlot';
import { EximWorkspaceAddress } from './eximWorkspaceAddress';
import { EximWorkspaceRole } from './eximWorkspaceRole';


export interface EximWorkspace { 
    name?: string;
    description?: string;
    theme?: string;
    homePage?: string;
    baseUrl?: string;
    companyName?: string;
    phoneNumber?: string;
    rssFeedUrl?: string;
    footerLabel?: string;
    logoUrl?: string;
    roles?: Array<EximWorkspaceRole>;
    products?: Array<EximProduct>;
    address?: EximWorkspaceAddress;
    slots?: Array<EximSlot>;
    menu?: MenuSnapshot;
}

