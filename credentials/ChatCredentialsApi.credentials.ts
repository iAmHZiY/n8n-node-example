import {
	ICredentialDataDecryptedObject,
	ICredentialType,
	IHttpRequestHelper,
	IHttpRequestOptions,
	INodeProperties,
} from 'n8n-workflow';
import path from 'path';
import fs from 'fs';
import axios, { AxiosRequestConfig } from 'axios';

const folderPath = 'chatCredentialUpdateTime';
const updateInterval = 7200;

export class ChatCredentialsApi implements ICredentialType {
	name = 'chatCredentialsApi';
	displayName = 'Chat Credentials API';
	documentationUrl = 'https://example.com/docs/auth';
	properties: INodeProperties[] = [
		// The credentials to get from user and save encrypted.
		// Properties can be defined exactly in the same way
		// as node properties.
		{
			displayName: 'CorpID',
			name: 'corpid',
			type: 'string',
			default: 'wxab249edd27d57738',
		},
		{
			displayName: 'Secret',
			name: 'secret',
			type: 'string',
			typeOptions: {
				password: true,
			},
			default: 'eBaQiroGYkhBFY9SlSUk621XTTF-6_qE3QWs0flkCC4',
		},
		{
			displayName: 'Token',
			name: 'token',
			type: 'hidden',
			typeOptions: {
				expirable: true,
			},
			default: '',
		},
	];
	axios = axios.create({baseURL: 'http://in.qyapi.weixin.qq.com'});

	async preAuthentication(this: IHttpRequestHelper, credentials: ICredentialDataDecryptedObject) {
		const url = 'http://in.qyapi.weixin.qq.com/cgi-bin/gettoken';
		const requestOptions: IHttpRequestOptions = {
			url,
			method: 'GET',
			json: true,
			skipSslCertificateValidation: true,
			qs: {
				corpid: credentials.corpid,
				corpsecret: credentials.secret,
			},
		};
		const { access_token } = (await this.helpers.httpRequest(requestOptions)) as {
			access_token: string;
		};
		return { token: access_token };
	}

	// This credential is currently not used by any node directly
	// but the HTTP Request node can use it to make requests.
	// The credential is also testable due to the `test` property below
	async authenticate(credentials: ICredentialDataDecryptedObject,
		requestOptions: IHttpRequestOptions): Promise<IHttpRequestOptions> {
			const isNeedUpdate = this.isAccessTokenNeedUpdate(credentials.corpid as string);
			let access_token = credentials.token;
			if (isNeedUpdate) {
				access_token = await this.requestAccessToken(credentials.corpid as string, credentials.secret as string);
			}
			// @ts-ignore
			requestOptions['qs'] = { access_token }
			return requestOptions as IHttpRequestOptions;
	}

	private async requestAccessToken(corpid:string, corpsecret:string) {
		const config: AxiosRequestConfig = {
      url: '/cgi-bin/gettoken',
      method: 'GET',
      params: { corpid, corpsecret },
    };
    const resp = await this.axios.request(config);
    if (resp.status !== 200 || resp.data.errcode != 0) {
      console.error('requestAccessToken failed %o, %o', config, resp);
    }
    return resp.data.access_token;
	}

	// 判断access_token是否需要更新
	private isAccessTokenNeedUpdate(corpid: string) {
		const filePath = path.join(folderPath, `${corpid}_time.txt`);
		const currentTime = new Date();

		if (!fs.existsSync(folderPath)) {
			fs.mkdirSync(folderPath);
			console.log(`Folder '${folderPath}' created.`);
		}

		if (!fs.existsSync(filePath)) {
			fs.writeFileSync(filePath, currentTime.toString());
			console.log(`File '${filePath}' created.`);
		} else {
			const fileContent = fs.readFileSync(filePath, 'utf-8');
			const lastTime = new Date(fileContent);
			const timeDiff = currentTime.getTime() - lastTime.getTime();
			const secondsDiff = Math.round(timeDiff / 1000);
			console.log(`Last time: ${lastTime}`);
			console.log(`Current time: ${currentTime}`);
			console.log(`Time interval: ${secondsDiff} seconds`);
			if (secondsDiff < updateInterval) {
				return false;
			}
		}
		return true;
	}
}
