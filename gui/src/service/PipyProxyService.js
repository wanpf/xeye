import { request, METHOD } from "@/service/common/request";
import { isServer } from "@/service/common/authority-utils";
const isDev = process.env.NODE_ENV === "development";
export default class PipyProxyService {
	login(user, password) {
		const loginPath = isDev ? (isServer() ? '/server/api/login' : '/client/api/login'):'/api/login';
		return request(loginPath, METHOD.POST, {
			user, password
		});
	}
	beforePath(id){
		return isDev?(id?`/server/${id}`:'/client'):(id?`/${id}`:'');
	}
	clients() {
		return request(isDev?'/server/users':'/users', METHOD.GET);
	}
	query({id, sql}) {
		return request(this.beforePath(id)+'/api', METHOD.POST, sql);
	}
	os({id, sql}) {
		return request(this.beforePath(id)+'/os', METHOD.POST, sql);
	}
	info({id}) {
		return request(this.beforePath(id)+'/api/info', METHOD.GET);
	}
	invoke({
		id,
		verb, 
		target
	}) {
		return request(this.beforePath(id)+'/api/invoke', METHOD.POST, {
			verb,
			target
		});
	}
}
