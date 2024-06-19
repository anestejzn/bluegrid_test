import axios from 'axios';
import {Response, Request} from 'express';

const API_URL = 'https://rest-test-eight.vercel.app/api/test';

interface ResponseItem {
  fileUrl: string;
};

interface ResponseData {
  items: ResponseItem[]
};

interface DirectoryObject {
  [directoryName: string]: (string|DirectoryObject)[];
};

interface TransformedData {
  [ipAddress: string]: DirectoryObject[];
};

const getItems = async (): Promise<ResponseItem[]> => {
  try {
    const response = await axios.get(API_URL);
    const data = response.data as ResponseData;

    return data.items;
  } catch (error) {
    throw error;
  }
};

const getPartsOfUrl = (url: string) => {
  const urlParts = url.split('/');
  const ipAddress = urlParts[2].split(':')[0]; //urlParts[2] is ip address with port, like 34.8.32.234:48183
  const pathParts = urlParts.slice(3); //parts of url without ip address
  const root = pathParts[0]; //first part of all parts without ip address
  const otherParts = pathParts.slice(1, -1); //all parts of url without first and last; they are directories
  const fileName = pathParts[pathParts.length - 1]; //last part of all parts without ip address; it is a file
  
  return {
    ipAddress: ipAddress,
    root: root,
    otherParts: otherParts,
    fileName: fileName
  };
}

const findObject = (list: (string | DirectoryObject)[], findingName: string) => {
  
  return list.find(obj => typeof obj === 'object' && obj.hasOwnProperty(findingName)) as DirectoryObject | undefined;
}

const findOrCreateObject = (list: (string | DirectoryObject)[], name: string): DirectoryObject => {
  let obj = findObject(list, name);
  if (!obj) {
    obj = { [name]: [] };
    list.push(obj);
  }
  
  return obj;
};

export const transformData = async (request: Request, response: Response): Promise<void> => {
  try{
    const dataItems = await getItems();
    const transformedData:TransformedData = {};
    for(const item of dataItems){
      const {ipAddress, root, otherParts, fileName} = getPartsOfUrl(item.fileUrl);

      //firstly, add ipAddress
      if (!transformedData[ipAddress]) {
        transformedData[ipAddress] = [];
      }
      
      let rootObj = findOrCreateObject(transformedData[ipAddress], root);
      // add all directories
      let current: (string | DirectoryObject)[] = rootObj[root];
      for(const part of otherParts){
        const directoryObj = findOrCreateObject(current, part);
        current = directoryObj[part] as (string | DirectoryObject)[];
      }

      //at the end, add file
      if (!current.includes(fileName)) {
        current.push(fileName);
      } 
    }

    response.json(transformedData);
  }
  catch (error) {
    response.status(500).send('Internal Server Error');
  }
}



