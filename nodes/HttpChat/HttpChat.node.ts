import { INodeType, INodeTypeDescription } from 'n8n-workflow';

export class HttpChat implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'HttpChat',
		name: 'httpChat',
		icon: 'file:chat.svg',
		group: ['transform'],
		subtitle: '={{$parameter["receiverType"]}}',
		description: 'Interact with httpChat API',
		version: 1,
		defaults: {
			name: 'HttpChat',
		},
		inputs: ['main'],
		outputs: ['main'],
		credentials: [
			{
				name: 'chatCredentialsV2Api',
				required: true,
			},
		],
		requestDefaults: {
			baseURL: 'http://localhost:5678/webhook/sendMessage',
			url: '',
			headers: {
				Accept: 'application/json',
				'Content-Type': 'application/json',
			},
		},
		properties: [
			{
				displayName: '接收方类型',
				description: '选择接收方类型',
				name: 'receiverType',
				type: 'options',
				required: true,
				options: [
					{name: '单聊', value: 'single'},
					{name: '群聊', value: 'group'},
				],
				default: 'single',
			},
			{
				displayName: '接收方ID',
				name: 'singleID',
				type: 'string',
				displayOptions: {
					show: {
						receiverType: ['single'],
					},
				},
				placeholder: '对方企业微信英文名',
				default: '',
			},
			{
				displayName: '接收方ID',
				name: 'groupID',
				type: 'string',
				displayOptions: {
					show: {
						receiverType: ['group'],
					},
				},
				placeholder: '群聊ID',
				default: '',
			},
			{
				displayName: '消息内容',
				name: 'content',
				type: 'json',
				required: true,
				default: '',
				routing: {
					request: {
						method: 'POST',
						body: {
							receiver: {
								type: '={{$parameter.receiverType}}',
								id: '={{$parameter.singleID || $parameter.groupID}}'
							},
							msgtype: 'text',
							text: {
								content: '={{$parameter.content}}'
							}
						},
					},
				},
			},
		],
	};
}
