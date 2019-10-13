import Factory from './api/factory';
import {EnvError} from './errors';
import {Buy} from './api/restful/buy';
import {Commerce} from './api/restful/commerce';
import {Developer} from './api/restful/developer';
import {Sell} from './api/restful/sell';
import {ClientAlerts, Finding, Shopping, Trading} from './api/traditional';
import {Auth, AuthToken, Settings, SiteId} from './types';
import OAuth2, {Scope} from './api/оAuth2';

const defaultSettings = {
    sandbox: false,
    siteId: SiteId.EBAY_DE
};

export default class EBay {
    readonly signin = {
        sandbox: 'https://signin.sandbox.ebay.com/ws/eBayISAPI.dll',
        production: 'https://signin.ebay.com/ws/eBayISAPI.dll'
    };

    private readonly factory: Factory;
    private readonly settings: Settings;
    private readonly auth: Auth;

    // RESTful
    private _buy?: Buy;
    private _commerce?: Commerce;
    private _developer?: Developer;
    private _sell?: Sell;

    // Traditional
    private _trading?: Trading;
    private _finding?: Finding;
    private _shopping?: Shopping;
    private _clientAlerts?: ClientAlerts;

    /**
     * Loads credentials from `process.env`
     *
     * @return {this}          a new Ebay instance
     * @throws {EnvError}
     */
    static fromEnv() {
        if (!process.env.EBAY_APP_ID) {
            throw new EnvError('EBAY_APP_ID');
        }
        if (!process.env.EBAY_CERT_ID) {
            throw new EnvError('EBAY_CERT_ID');
        }
        if (!process.env.EBAY_DEV_ID) {
            throw new EnvError('EBAY_DEV_ID');
        }

        return new EBay({
            appId: process.env.EBAY_APP_ID,
            certId: process.env.EBAY_CERT_ID,
            devId: process.env.EBAY_DEV_ID,
            authToken: process.env.EBAY_AUTH_TOKEN,
            siteId: process.env.EBAY_SITE_ID ? parseInt(process.env.EBAY_SITE_ID, 10) : SiteId.EBAY_DE,
            ruName: process.env.EBAY_RU_NAME,
            sandbox: (process.env.EBAY_SANDBOX === 'true')
        });
    }

    /**
     * @param {Object}  settings the global settings
     * @param {Scope} scope the scope
     */
    constructor(settings: Settings, scope?: Scope) {
        this.settings = {...defaultSettings, ...settings};

        this.auth = {
            oAuth2: new OAuth2(
                this.settings.appId,
                this.settings.certId,
                this.settings.sandbox,
                scope,
                this.settings.ruName
            ),
            sandbox: settings.sandbox,
            ruName: settings.ruName,
        };

        if (settings.authToken) {
            this.setAuthToken({
                eBayAuthToken: settings.authToken
            })
        }

        this.factory = new Factory(this.settings, this.auth);
    }

    get buy(): Buy {
        return this._buy || (this._buy = this.factory.createBuyApi());
    }

    get commerce(): Commerce {
        return this._commerce || (this._commerce = this.factory.createCommerceApi());
    }

    get developer(): Developer {
        return this._developer || (this._developer = this.factory.createDeveloperApi());
    }

    get sell(): Sell {
        return this._sell || (this._sell = this.factory.createSellApi());
    }

    // Traditional
    get trading(): Trading {
        return this._trading || (this._trading = this.factory.createTradingApi());
    }

    get finding(): Finding {
        return this._finding || (this._finding = this.factory.createFindingApi());
    }

    get shopping(): Shopping {
        return this._shopping || (this._shopping = this.factory.createShoppingApi());
    }

    get clientAlerts(): ClientAlerts {
        return this._clientAlerts || (this._clientAlerts = this.factory.createClientAlertsApi());
    }

    // XML Flow Tutorial: Getting Tokens: Auth'n'Auth

    /**
     * Generates URL for consent page landing.
     *
     * @param ruName RuName
     */
    async getSessionIdAndAuthUrl(ruName?: string) {
        ruName = ruName || this.auth.ruName;
        if (!ruName) {
            throw new Error('RuName is required.');
        }

        const response = await this.trading.GetSessionID({
            RuName: ruName
        });

        return {
            sessionId: response.SessionID,
            url: [
                this.signin[this.settings.sandbox ? 'sandbox' : 'production'],
                '?SignIn',
                '&RuName=', encodeURIComponent(ruName),
                '&SessID=', encodeURIComponent(response.SessionID)
            ].join('')
        };
    }

    async fetchAuthToken(sessionId: string) {
        return this.trading.FetchToken({
            SessionID: sessionId
        });
    }

    setAuthToken(authToken: AuthToken) {
        this.auth.authToken = authToken;
    }
}

export {
    SiteId,
    Settings
};
