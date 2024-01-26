const table = "pipy";
export default class SqlService {
	
	getSql({where, sortField, sortOrder, pageSize, current}){
		let _order = sortOrder==-1?'desc':'asc';
		let sql = `Select 
		 client_ip,
		 host,
		 id,
		 request_size,
		 request_time,
		 response_code,
		 response_size,
		 response_time,
		 scheme,
		 url,
		 user_agent
		 From ${table} ${where ||''} order by ${sortField || 'request_time'} ${_order} Limit ${pageSize} Offset ${current}`;
		return sql;
	}

	getDetailSql(id){
		let sql = `Select 
		 client_ip,
		 host,
		 id,
		 request_body,
		 request_head,
		 request_size,
		 request_time,
		 response_body,
		 response_code,
		 response_head,
		 response_size,
		 response_time,
		 scheme,
		 url,
		 user_agent
		 From ${table} where id = '${id}'`;
		return sql;
	}
	getCount(where){
		let sql = `Select count(1) From ${table} ${where ||''} `;
		return sql
	}
	getLeftSql(where, groupBy){
		let sql = `Select count(1) as value,${groupBy} as name From ${table} ${where ||''} group by ${groupBy}`;
		return sql
	}
	getRightSql(where){
		let sql = `Select response_time, request_time From ${table} ${where ||''} order by request_time asc`;
		return sql
	}
}
