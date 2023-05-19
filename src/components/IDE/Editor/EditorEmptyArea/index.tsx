import { observer } from 'mobx-react-lite';
import { useStore } from '@/store/index';
import { Button, Flex } from '@chakra-ui/react';
import { helper, toast } from '@/lib/helper';
import _ from 'lodash';
import { hooks } from '@/lib/hooks';
import { defaultOutlineButtonStyle } from '@/lib/theme';

export const EditorEmptyArea = observer(() => {
  const {
    w3s,
    w3s: { projectManager }
  } = useStore();
  return (
    <Flex justify={'center'} align="center" direction="column" w="full">
      <Flex justify={'center'} mt={12}>
        No File Selected!
      </Flex>
      <Button
        mt={4}
        w="50%"
        {...defaultOutlineButtonStyle}
        onClick={async () => {
          const formData = await hooks.getFormData({
            title: 'Create a File',
            size: '2xl',
            formList: [
              {
                form: w3s.projectManager.initWasmTemplateForm
              }
            ]
          });
          if (!formData.template) {
            return toast.warning('Please select a template!');
          }
          w3s.projectManager.curFilesListSchema.createFileFormFolder(w3s.projectManager.curFilesList[0], 'file', helper.json.safeParse(formData.template) ?? null);
        }}
      >
        New File
      </Button>
    </Flex>
  );
});