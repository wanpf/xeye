<script setup>
import { ref, onMounted } from 'vue';
import PipyProxyService from '@/service/PipyProxyService';
import { useRoute } from 'vue-router'
import { isAdmin } from "@/service/common/authority-utils";
import store from "@/store";

const route = useRoute();
const pipyProxyService = new PipyProxyService();
const info = ref({
  "hostname": "DESKTOP-5SI23LH",
  "osName": "Microsoft Windows 10",
  "osVersion": "10.0.19045  Build 19045",
  "lastBootUptime": "2023/12/26, 10:27:09",
  "cpuInfo": "Intel64 Family 6 Model 154 Stepping 3 GenuineIntel ~2496 Mhz",
  "ipAddress": "192.168.122.242",
  "mac": "52-54-00-B8-84-04"
});
const search = () => {
	store.commit('account/setClient', route.params?.id);
	pipyProxyService.info({
		id: route.params?.id
	})
		.then(res => {
			info.value = res?.data;
		})
		.catch(err => console.log('Request Failed', err)); 
}
const tags = ref([]);

const changeTag = (tags) => {
	if(!!route.params?.id){
		localStorage.setItem('tagList', JSON.stringify(tags.value));
	} else {
		localStorage.setItem('tags', tags.value.join(","));
	}
}
const loadTag = () => {
	
	if(!!route.params?.id){
		const tagJSON = !!localStorage.getItem('tagList')?JSON.parse(localStorage.getItem('tagList')):{};
		tags.value = tagJSON;
		if(!tags.value.hasOwnProperty(route.params?.id)){
			tags.value[route.params?.id] = [];
		}
	} else {
		const tagStr = (localStorage.getItem('tags')||'');
		tags.value = tagStr == ""?[]:tagStr.split(",");
	}
}
onMounted(() => {
	search();
	loadTag();
});
const home = ref({
    icon: 'pi pi-desktop'
});
</script>

<template>
	<div v-if="route.params?.id" style="padding-left: 0px;padding-top: 0;padding-right: 0;m">
		<Breadcrumb :home="home" :model="[{label:route.params?.id}]" />
	</div>
	<div class="pt-5 pl-5 pr-5">
		<BlockViewer  text="Json" tag="Client" header="Host Information" :code="JSON.stringify(info,null,'\t')" containerClass="surface-section px-4 py-8 md:px-6 lg:px-8" >
				<div class="surface-section">
						<div class="font-medium text-3xl text-900 mb-3">{{info.hostname}}</div>
						<div class="text-500 mb-5">{{info.ipAddress}}</div>
						<ul class="list-none p-0 m-0">
								<li class="flex align-items-center py-3 px-2 border-top-1 surface-border flex-wrap">
										<div class="text-500 w-6 md:w-2 font-medium">Os Name</div>
										<div class="text-900 w-full md:w-8 md:flex-order-0 flex-order-1">{{info.osName||'-'}}</div>
								</li>
								<li class="flex align-items-center py-3 px-2 border-top-1 surface-border flex-wrap">
										<div class="text-500 w-6 md:w-2 font-medium">Os Version</div>
										<div class="text-900 w-full md:w-8 md:flex-order-0 flex-order-1">
												<Chip :label="info.osVersion||'0.0'" class="mr-2"></Chip>
										</div>
								</li>
								<li class="flex align-items-center py-3 px-2 border-top-1 surface-border flex-wrap">
										<div class="text-500 w-6 md:w-2 font-medium">Last Boot Uptime</div>
										<div class="text-900 w-full md:w-8 md:flex-order-0 flex-order-1">{{info.lastBootUptime||'-'}}</div>
								</li>
								<li class="flex align-items-center py-3 px-2 border-top-1 surface-border flex-wrap">
										<div class="text-500 w-6 md:w-2 font-medium">CPU Info</div>
										<div class="text-900 w-full md:w-8 md:flex-order-0 flex-order-1">{{info.cpuInfo||'-'}}</div>
								</li>
								<li class="flex align-items-center py-3 px-2 border-top-1 surface-border flex-wrap">
										<div class="text-500 w-6 md:w-2 font-medium">Ip Address</div>
										<div class="text-900 w-full md:w-8 md:flex-order-0 flex-order-1">{{info.ipAddress||'-'}}</div>
								</li>
								<li class="flex align-items-center py-3 px-2 border-top-1  surface-border flex-wrap">
										<div class="text-500 w-6 md:w-2 font-medium">MAC</div>
										<div class="text-900 w-full md:w-8 md:flex-order-0 flex-order-1">{{info.mac||'-'}}</div>
								</li>
								
								<li class="flex align-items-center py-3 px-2 border-top-1 border-bottom-1 surface-border flex-wrap">
										<div class="text-500 w-6 md:w-2 font-medium">Tags</div>
										<div class="text-900 w-full md:w-8 md:flex-order-0 flex-order-1">
											<ChipList v-if="!!route.params?.id" v-model:list="tags[route.params.id]" @change="changeTag"/>
											<ChipList v-else v-model:list="tags" @change="changeTag"/>
										</div>
								</li>
						</ul>
				</div>
		</BlockViewer>
	</div>
</template>


<style scoped lang="scss">
::v-deep(.p-breadcrumb){
	border-radius: 0;
	border-left: none;
	border-right: none;
}
</style>
