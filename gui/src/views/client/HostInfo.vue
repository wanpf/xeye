<script setup>
import { ref, onMounted } from 'vue';
import PipyProxyService from '@/service/PipyProxyService';
import { useRoute } from 'vue-router'
import { useToast } from "primevue/usetoast";
import { isAdmin } from "@/service/common/authority-utils";
import store from "@/store";

const route = useRoute();
const toast = useToast();
const pipyProxyService = new PipyProxyService();
const info = ref({
  "hostname": "-",
  "osName": "-",
  "osVersion": "-",
  "lastBootUptime": "-",
  "cpuInfo": "-",
  "ipAddress": "-",
  "mac": "-"
});
const ca = ref({
	organization:'',
	commonName: ''
});
const tags = ref([]);
const search = () => {
	store.commit('account/setClient', route.params?.id);
	pipyProxyService.info({
		id: route.params?.id
	})
		.then(res => {
			info.value = res?.data;
		})
		.catch(err => console.log('Request Failed', err)); 
		
		
	pipyProxyService.getCa({
		id: route.params?.id
	})
		.then(res => {
			ca.value = res?.data;
		})
		.catch(err => console.log('Request Failed', err)); 
}

const commitCa = () => {
	pipyProxyService.renewCa({
		id: route.params?.id,
		organization: ca.value?.organization,
		commonName: ca.value?.commonName,
	})
		.then(res => {
			if(res.data?.status == 'OK'){
				toast.add({ severity: 'success', summary:'Tips', detail: 'Modified successfully.', life: 3000 });
			} else{
				toast.add({ severity: 'error', summary:'Tips', detail: 'Modified Failed.', life: 3000 });
			}
		})
		.catch(err => console.log('Request Failed', err)); 
}
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
		<BlockViewer  text="Json" tag="Client" header="Host Information" :code="JSON.stringify(info,null,'\t')" containerClass="surface-section px-4 py-7 md:px-6 lg:px-7" >
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
								
								<li class="flex align-items-center py-3 px-2 border-bottom-1 surface-border flex-wrap">
										<div class="text-500 w-6 md:w-2 font-medium">CA Certificate</div>
										<div class="text-900 w-full md:w-8 md:flex-order-0 flex-order-1">
											<Chip class="pl-0 pr-3 mr-2">
											    <span class="bg-primary border-circle w-2rem h-2rem flex align-items-center justify-content-center">
														<i class="pi pi-sitemap"/>
													</span>
											    <span class="ml-2 font-medium">
														<InputText placeholder="Organization" class="add-tag-input xl" :unstyled="true" v-model="ca.organization" type="text" />
													</span>
											</Chip>
											<Chip class="pl-0 pr-3 mr-2">
											    <span class="bg-primary border-circle w-2rem h-2rem flex align-items-center justify-content-center">
														<i class="pi pi-bookmark"/>
													</span>
											    <span class="ml-2 font-medium">
														<InputText placeholder="Common Name" class="add-tag-input xxl" :unstyled="true" v-model="ca.commonName" type="text" />
													</span>
											</Chip>
											<Button class="min-btn" rounded :disabled="ca.organization.length == 0 || ca.commonName.length == 0" icon="pi pi-check" aria-label="Submit" size="small" @click="commitCa"/>
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
