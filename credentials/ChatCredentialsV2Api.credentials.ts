import {
	IAuthenticateGeneric,
	ICredentialDataDecryptedObject,
	ICredentialType,
	IHttpRequestHelper,
	IHttpRequestOptions,
	INodeProperties,
} from 'n8n-workflow';

export class ChatCredentialsV2Api implements ICredentialType {
	name = 'chatCredentialsV2Api';
	displayName = 'Chat Credentials V2 API';
	documentationUrl = 'https://example.com/docs/auth';
	properties: INodeProperties[] = [
		// The credentials to get from user and save encrypted.
		// Properties can be defined exactly in the same way
		// as node properties.
		{
			displayName: 'CorpID',
			name: 'corpid',
			type: 'string',
			default: '',
		},
		{
			displayName: 'Secret',
			name: 'secret',
			type: 'string',
			typeOptions: {
				password: true,
			},
			default: '',
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
	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			qs: {
				// Send this as part of the query string
				access_token: '={{ $credentials.token }}',
			},
		},
	};
}
